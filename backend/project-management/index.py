import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

def escape_sql(value):
    """Escape value for SQL query (simple query protocol)"""
    if value is None:
        return 'NULL'
    if isinstance(value, (int, float)):
        return str(value)
    # Escape single quotes by doubling them
    return f"'{str(value).replace(chr(39), chr(39)+chr(39))}'"

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Unified API for project management (create projects, estimates, payments, get companies, items)
    Args: event - dict with httpMethod, queryStringParameters for action
          context - object with attributes: request_id, function_name
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    params = event.get('queryStringParameters', {}) or {}
    action = params.get('action', '')
    
    if method == 'GET':
        if action == 'debug':
            cur.execute('SELECT current_user, session_user')
            user_info = cur.fetchone()
            result = {'current_user': user_info[0], 'session_user': user_info[1], 'dsn': dsn}
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps(result),
                'isBase64Encoded': False
            }
        
        if action == 'companies':
            cur.execute('SELECT id, name, contact_person, email, phone FROM companies ORDER BY name')
            result = [dict(row) for row in cur.fetchall()]
        
        elif action == 'items':
            cur.execute('SELECT id, name, description, type, unit, COALESCE(default_price, 0) as default_price FROM items ORDER BY type, name')
            rows = cur.fetchall()
            result = []
            for row in rows:
                row_dict = dict(row)
                row_dict['default_price'] = str(row_dict['default_price'])
                result.append(row_dict)
        
        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid action'}),
                'isBase64Encoded': False
            }
        
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps(result),
            'isBase64Encoded': False
        }
    
    elif method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        
        if action == 'create-project':
            company_id = int(body_data['company_id'])
            title = escape_sql(body_data['title'])
            description = escape_sql(body_data.get('description', ''))
            budget = float(body_data.get('budget', 0))
            status = escape_sql(body_data.get('status', 'planning'))
            start_date = escape_sql(body_data.get('start_date')) if body_data.get('start_date') else 'NULL'
            
            cur.execute(
                f'''INSERT INTO projects (company_id, title, description, budget, status, start_date)
                   VALUES ({company_id}, {title}, {description}, {budget}, {status}, {start_date}) RETURNING id'''
            )
            project_id = cur.fetchone()['id']
            
            if body_data.get('items'):
                for item in body_data['items']:
                    item_id = int(item['item_id'])
                    quantity = float(item['quantity'])
                    unit_price = float(item['unit_price'])
                    cur.execute(
                        f'''INSERT INTO project_items (project_id, item_id, quantity, unit_price)
                           VALUES ({project_id}, {item_id}, {quantity}, {unit_price})'''
                    )
            
            if body_data.get('contractors'):
                for contractor in body_data['contractors']:
                    contractor_id = int(contractor['contractor_id'])
                    role = escape_sql(contractor['role'])
                    hourly_rate = float(contractor['hourly_rate'])
                    cur.execute(
                        f'''INSERT INTO project_contractors (project_id, contractor_id, role, hourly_rate)
                           VALUES ({project_id}, {contractor_id}, {role}, {hourly_rate})'''
                    )
            
            conn.commit()
            result = {'id': project_id, 'message': 'Project created successfully'}
        
        elif action == 'create-estimate':
            company_id = int(body_data['company_id'])
            title = escape_sql(body_data['title'])
            description = escape_sql(body_data.get('description', ''))
            status = escape_sql(body_data.get('status', 'draft'))
            estimated_hours_str = body_data.get('estimated_hours', '0')
            estimated_hours = float(estimated_hours_str) if estimated_hours_str else 0
            
            cur.execute(
                f'''INSERT INTO estimates (company_id, title, description, status, estimated_hours)
                   VALUES ({company_id}, {title}, {description}, {status}, {estimated_hours}) RETURNING id'''
            )
            estimate_id = cur.fetchone()['id']
            
            if body_data.get('items'):
                for item in body_data['items']:
                    item_id = int(item['item_id'])
                    quantity = float(item['quantity'])
                    unit_price = float(item['unit_price'])
                    cur.execute(
                        f'''INSERT INTO estimate_items (estimate_id, item_id, quantity, unit_price)
                           VALUES ({estimate_id}, {item_id}, {quantity}, {unit_price})'''
                    )
            
            conn.commit()
            result = {'id': estimate_id, 'message': 'Estimate created successfully'}
        
        elif action == 'create-payment':
            project_id = int(body_data['project_id'])
            contractor_id = int(body_data['contractor_id']) if body_data.get('contractor_id') else 'NULL'
            payment_type = escape_sql(body_data['type'])
            amount = float(body_data['amount'])
            description = escape_sql(body_data.get('description', ''))
            payment_date = escape_sql(body_data['payment_date'])
            status = escape_sql(body_data.get('status', 'pending'))
            
            cur.execute(
                f'''INSERT INTO payments (project_id, contractor_id, type, amount, description, payment_date, status)
                   VALUES ({project_id}, {contractor_id}, {payment_type}, {amount}, {description}, {payment_date}, {status}) RETURNING id'''
            )
            payment_id = cur.fetchone()['id']
            
            conn.commit()
            result = {'id': payment_id, 'message': 'Payment created successfully'}
        
        elif action == 'create-item':
            name = escape_sql(body_data['name'])
            description = escape_sql(body_data.get('description', ''))
            item_type = escape_sql(body_data['type'])
            unit = escape_sql(body_data['unit'])
            default_price = float(body_data['default_price']) if body_data.get('default_price') else 'NULL'
            
            cur.execute(
                f'''INSERT INTO items (name, description, type, unit, default_price)
                   VALUES ({name}, {description}, {item_type}, {unit}, {default_price}) RETURNING id'''
            )
            item_id = cur.fetchone()['id']
            
            conn.commit()
            result = {'id': item_id, 'message': 'Item created successfully'}
        
        else:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid action'}),
                'isBase64Encoded': False
            }
        
        cur.close()
        conn.close()
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps(result),
            'isBase64Encoded': False
        }
    
    cur.close()
    conn.close()
    return {
        'statusCode': 405,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }