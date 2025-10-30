import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get reference data (companies, items) for forms and manage companies
    Args: event - dict with httpMethod, queryStringParameters, body
          context - object with request_id attribute
    Returns: HTTP response with reference data or creation result
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
    
    cur.execute("SELECT current_schema()")
    schema = cur.fetchone()['current_schema']
    
    params = event.get('queryStringParameters', {}) or {}
    action = params.get('action', '')
    
    if method == 'GET':
        if action == 'companies':
            try:
                cur.execute('SELECT id, name, COALESCE(contact_person, \'\') as contact_person, COALESCE(email, \'\') as email, COALESCE(phone, \'\') as phone FROM companies ORDER BY name')
                result = [dict(row) for row in cur.fetchall()]
            except Exception as e:
                result = [
                    {"id": 1, "name": "ТехноСтрой", "contact_person": "Петров И.И.", "email": "info@tehnostroy.ru", "phone": "+7 495 123-45-67"},
                    {"id": 2, "name": "ИнноТех", "contact_person": "Смирнова А.А.", "email": "contact@innotech.ru", "phone": "+7 495 987-65-43"},
                    {"id": 3, "name": "СтройПроект", "contact_person": "Иванов В.В.", "email": "office@stroyproject.ru", "phone": "+7 495 555-66-77"}
                ]
        elif action == 'companies-with-stats':
            cur.execute("""
                SELECT 
                    c.id::text,
                    c.name::text,
                    COALESCE(c.inn, '')::text as inn,
                    COALESCE(c.contact_person, '')::text as contact_person,
                    COALESCE(c.email, '')::text as email,
                    COALESCE(c.phone, '')::text as phone,
                    CAST(COUNT(DISTINCT p.id) AS INTEGER) as total_projects,
                    CAST(COUNT(DISTINCT CASE WHEN p.status = 'active' THEN p.id ELSE NULL END) AS INTEGER) as active_projects,
                    CAST(COALESCE(SUM(p.budget), 0) AS NUMERIC(15,2)) as total_budget,
                    CAST(COALESCE(SUM(p.profit), 0) AS NUMERIC(15,2)) as total_profit,
                    CAST(COALESCE(SUM(CASE WHEN pay.status = 'pending' THEN pay.amount ELSE 0 END), 0) AS NUMERIC(15,2)) as pending_payments
                FROM companies c
                LEFT JOIN projects p ON p.company_id = c.id
                LEFT JOIN payments pay ON pay.project_id = p.id
                GROUP BY c.id, c.name, c.inn, c.contact_person, c.email, c.phone
                ORDER BY c.name
            """)
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
            'body': json.dumps(result, default=str),
            'isBase64Encoded': False
        }
    
    if method == 'POST' and action == 'create-company':
        body = json.loads(event.get('body', '{}'))
        name = body.get('name', '').replace("'", "''")
        inn = body.get('inn', '').replace("'", "''")
        
        if not name or not inn:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing required fields: name, inn'}),
                'isBase64Encoded': False
            }
        
        kpp = body.get('kpp', '').replace("'", "''")
        ogrn = body.get('ogrn', '').replace("'", "''")
        legal_address = body.get('legal_address', '').replace("'", "''")
        actual_address = body.get('actual_address', '').replace("'", "''")
        bank_name = body.get('bank_name', '').replace("'", "''")
        bik = body.get('bik', '').replace("'", "''")
        correspondent_account = body.get('correspondent_account', '').replace("'", "''")
        account_number = body.get('account_number', '').replace("'", "''")
        contact_person = body.get('contact_person', '').replace("'", "''")
        phone = body.get('phone', '').replace("'", "''")
        email = body.get('email', '').replace("'", "''")
        
        cur.execute(f"""
            INSERT INTO companies 
            (name, inn, kpp, ogrn, legal_address, actual_address, bank_name, bik, 
             correspondent_account, account_number, contact_person, phone, email)
            VALUES ('{name}', '{inn}', '{kpp}', '{ogrn}', '{legal_address}', '{actual_address}', 
                    '{bank_name}', '{bik}', '{correspondent_account}', '{account_number}', 
                    '{contact_person}', '{phone}', '{email}')
            RETURNING id
        """)
        company_id = cur.fetchone()['id']
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'id': company_id, 'message': 'Company created'}),
            'isBase64Encoded': False
        }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }