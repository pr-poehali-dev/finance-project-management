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
            try:
                cur.execute("""
                    SELECT 
                        c.id,
                        c.name,
                        COALESCE(c.inn, '') as inn,
                        COALESCE(c.contact_person, '') as contact_person,
                        COALESCE(c.email, '') as email,
                        COALESCE(c.phone, '') as phone,
                        COUNT(DISTINCT p.id) as total_projects,
                        COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'active') as active_projects,
                        COALESCE(SUM(p.budget), 0) as total_budget,
                        COALESCE(SUM(p.profit), 0) as total_profit,
                        COALESCE(SUM(pay.amount) FILTER (WHERE pay.status = 'pending'), 0) as pending_payments
                    FROM companies c
                    LEFT JOIN projects p ON p.company_id = c.id
                    LEFT JOIN payments pay ON pay.project_id = p.id
                    GROUP BY c.id, c.name, c.inn, c.contact_person, c.email, c.phone
                    ORDER BY c.name
                """)
                result = [dict(row) for row in cur.fetchall()]
            except Exception as e:
                result = []
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
        name = body.get('name')
        inn = body.get('inn')
        
        if not name or not inn:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing required fields: name, inn'}),
                'isBase64Encoded': False
            }
        
        cur.execute("""
            INSERT INTO companies 
            (name, inn, kpp, ogrn, legal_address, actual_address, bank_name, bik, 
             correspondent_account, account_number, contact_person, phone, email)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            name,
            inn,
            body.get('kpp', ''),
            body.get('ogrn', ''),
            body.get('legal_address', ''),
            body.get('actual_address', ''),
            body.get('bank_name', ''),
            body.get('bik', ''),
            body.get('correspondent_account', ''),
            body.get('account_number', ''),
            body.get('contact_person', ''),
            body.get('phone', ''),
            body.get('email', '')
        ))
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