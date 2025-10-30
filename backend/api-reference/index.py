import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get reference data (companies, items) for forms
    Args: event - dict with httpMethod, queryStringParameters
          context - object with request_id attribute
    Returns: HTTP response with reference data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    params = event.get('queryStringParameters', {}) or {}
    action = params.get('action', '')
    
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