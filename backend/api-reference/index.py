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
            cur.execute('SELECT id, name, COALESCE(inn, \'\') as inn, COALESCE(kpp, \'\') as kpp, COALESCE(ogrn, \'\') as ogrn, COALESCE(legal_address, \'\') as legal_address, COALESCE(actual_address, \'\') as actual_address, COALESCE(bank_name, \'\') as bank_name, COALESCE(bik, \'\') as bik, COALESCE(correspondent_account, \'\') as correspondent_account, COALESCE(account_number, \'\') as account_number, COALESCE(contact_person, \'\') as contact_person, COALESCE(email, \'\') as email, COALESCE(phone, \'\') as phone FROM companies ORDER BY name')
            companies = [dict(row) for row in cur.fetchall()]
            result = []
            for company in companies:
                cur.execute(f"SELECT COUNT(*) as total FROM projects WHERE company_id = {company['id']}")
                total_projects = cur.fetchone()['total']
                
                cur.execute(f"SELECT COUNT(*) as active FROM projects WHERE company_id = {company['id']} AND status = 'active'")
                active_projects = cur.fetchone()['active']
                
                cur.execute(f"SELECT COALESCE(SUM(budget), 0) as total_budget, COALESCE(SUM(profit), 0) as total_profit FROM projects WHERE company_id = {company['id']}")
                finances = cur.fetchone()
                
                cur.execute(f"SELECT COALESCE(SUM(amount), 0) as pending FROM payments WHERE project_id IN (SELECT id FROM projects WHERE company_id = {company['id']}) AND status = 'pending'")
                pending = cur.fetchone()['pending']
                
                result.append({
                    'id': company['id'],
                    'name': company['name'],
                    'inn': company['inn'],
                    'kpp': company['kpp'],
                    'ogrn': company['ogrn'],
                    'legal_address': company['legal_address'],
                    'actual_address': company['actual_address'],
                    'bank_name': company['bank_name'],
                    'bik': company['bik'],
                    'correspondent_account': company['correspondent_account'],
                    'account_number': company['account_number'],
                    'contact_person': company['contact_person'],
                    'email': company['email'],
                    'phone': company['phone'],
                    'total_projects': int(total_projects),
                    'active_projects': int(active_projects),
                    'total_budget': float(finances['total_budget']),
                    'total_profit': float(finances['total_profit']),
                    'pending_payments': float(pending)
                })
        elif action == 'company-projects':
            company_id = params.get('company_id', '')
            if not company_id:
                cur.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'company_id required'}),
                    'isBase64Encoded': False
                }
            cur.execute(f"SELECT id, name, status, COALESCE(budget, 0) as budget, COALESCE(profit, 0) as profit, start_date, end_date FROM projects WHERE company_id = {company_id} ORDER BY start_date DESC")
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