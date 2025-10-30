import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage project estimates - get all estimates with company info
    Args: event - dict with httpMethod
          context - object with request_id attribute
    Returns: HTTP response with estimates list
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
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT 
            e.id,
            e.title,
            e.description,
            e.estimated_cost,
            e.estimated_hours,
            e.status,
            e.created_at,
            c.name as company_name,
            CASE 
                WHEN EXISTS (SELECT 1 FROM projects WHERE estimate_id = e.id) 
                THEN true 
                ELSE false 
            END as converted_to_project
        FROM estimates e
        LEFT JOIN companies c ON e.company_id = c.id
        ORDER BY e.created_at DESC
    """)
    estimates = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps([dict(row) for row in estimates], default=str)
    }
