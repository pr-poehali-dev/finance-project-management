import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage contractors - get all contractors with payment history
    Args: event - dict with httpMethod
          context - object with request_id attribute
    Returns: HTTP response with contractors list
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
            c.id,
            c.name,
            c.specialization,
            c.email,
            c.phone,
            c.hourly_rate,
            COUNT(p.id) as total_projects,
            COALESCE(SUM(p.amount), 0) as total_earned,
            COUNT(p.id) FILTER (WHERE p.status = 'pending') as pending_payments
        FROM contractors c
        LEFT JOIN payments p ON p.contractor_id = c.id
        GROUP BY c.id
        ORDER BY total_earned DESC
    """)
    contractors = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps([dict(row) for row in contractors], default=str)
    }
