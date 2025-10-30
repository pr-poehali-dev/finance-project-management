import json
import os
import psycopg2
from typing import Dict, Any

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
    cur = conn.cursor()
    
    SCHEMA = 't_p90379979_finance_project_mana'
    
    params = event.get('queryStringParameters', {}) or {}
    action = params.get('action', '')
    
    if method == 'GET':
        if action == 'companies':
            cur.execute(f'SELECT id, name, contact_person, email, phone FROM {SCHEMA}.companies ORDER BY name')
            result = []
            for row in cur.fetchall():
                result.append({
                    'id': row[0],
                    'name': row[1],
                    'contact_person': row[2],
                    'email': row[3],
                    'phone': row[4]
                })
        
        elif action == 'items':
            cur.execute(f'SELECT id, name, description, type, unit, default_price FROM {SCHEMA}.items ORDER BY type, name')
            result = []
            for row in cur.fetchall():
                result.append({
                    'id': row[0],
                    'name': row[1],
                    'description': row[2],
                    'type': row[3],
                    'unit': row[4],
                    'default_price': str(row[5]) if row[5] else '0'
                })
        
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
            cur.execute(
                f'''INSERT INTO {SCHEMA}.projects (company_id, title, description, budget, status, start_date)
                   VALUES (%s, %s, %s, %s, %s, %s) RETURNING id''',
                (
                    int(body_data['company_id']),
                    body_data['title'],
                    body_data.get('description', ''),
                    float(body_data.get('budget', 0)),
                    body_data.get('status', 'planning'),
                    body_data.get('start_date') or None
                )
            )
            project_id = cur.fetchone()[0]
            
            if body_data.get('items'):
                for item in body_data['items']:
                    cur.execute(
                        f'''INSERT INTO {SCHEMA}.project_items (project_id, item_id, quantity, unit_price)
                           VALUES (%s, %s, %s, %s)''',
                        (project_id, item['item_id'], float(item['quantity']), float(item['unit_price']))
                    )
            
            if body_data.get('contractors'):
                for contractor in body_data['contractors']:
                    cur.execute(
                        f'''INSERT INTO {SCHEMA}.project_contractors (project_id, contractor_id, role, hourly_rate)
                           VALUES (%s, %s, %s, %s)''',
                        (project_id, contractor['contractor_id'], contractor['role'], float(contractor['hourly_rate']))
                    )
            
            conn.commit()
            result = {'id': project_id, 'message': 'Project created successfully'}
        
        elif action == 'create-estimate':
            cur.execute(
                f'''INSERT INTO {SCHEMA}.estimates (company_id, title, description, status, estimated_hours)
                   VALUES (%s, %s, %s, %s, %s) RETURNING id''',
                (
                    int(body_data['company_id']),
                    body_data['title'],
                    body_data.get('description', ''),
                    body_data.get('status', 'draft'),
                    float(body_data.get('estimated_hours', 0))
                )
            )
            estimate_id = cur.fetchone()[0]
            
            if body_data.get('items'):
                for item in body_data['items']:
                    cur.execute(
                        f'''INSERT INTO {SCHEMA}.estimate_items (estimate_id, item_id, quantity, unit_price)
                           VALUES (%s, %s, %s, %s)''',
                        (estimate_id, item['item_id'], float(item['quantity']), float(item['unit_price']))
                    )
            
            conn.commit()
            result = {'id': estimate_id, 'message': 'Estimate created successfully'}
        
        elif action == 'create-payment':
            contractor_id = body_data.get('contractor_id')
            if contractor_id:
                contractor_id = int(contractor_id)
            
            cur.execute(
                f'''INSERT INTO {SCHEMA}.payments (project_id, contractor_id, type, amount, description, payment_date, status)
                   VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id''',
                (
                    int(body_data['project_id']),
                    contractor_id,
                    body_data['type'],
                    float(body_data['amount']),
                    body_data.get('description', ''),
                    body_data['payment_date'],
                    body_data.get('status', 'pending')
                )
            )
            payment_id = cur.fetchone()[0]
            
            conn.commit()
            result = {'id': payment_id, 'message': 'Payment created successfully'}
        
        elif action == 'create-item':
            cur.execute(
                f'''INSERT INTO {SCHEMA}.items (name, description, type, unit, default_price)
                   VALUES (%s, %s, %s, %s, %s) RETURNING id''',
                (
                    body_data['name'],
                    body_data.get('description', ''),
                    body_data['type'],
                    body_data['unit'],
                    float(body_data.get('default_price', 0)) if body_data.get('default_price') else None
                )
            )
            item_id = cur.fetchone()[0]
            
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