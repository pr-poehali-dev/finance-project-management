import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage contractors - get all contractors with payment history, create new contractors
    Args: event - dict with httpMethod, body, queryStringParameters
          context - object with request_id attribute
    Returns: HTTP response with contractors list or creation result
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
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    params = event.get('queryStringParameters', {}) or {}
    action = params.get('action', '')
    
    if method == 'GET':
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
    
    if method == 'POST' and action == 'create-contractor':
        body = json.loads(event.get('body', '{}'))
        name = body.get('name')
        specialization = body.get('specialization')
        email = body.get('email')
        phone = body.get('phone', '')
        hourly_rate = body.get('hourly_rate')
        
        if not name or not specialization or not email or not hourly_rate:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing required fields'}),
                'isBase64Encoded': False
            }
        
        cur.execute(
            "INSERT INTO contractors (name, specialization, email, phone, hourly_rate) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (name, specialization, email, phone, hourly_rate)
        )
        contractor_id = cur.fetchone()['id']
        conn.commit()
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'id': contractor_id, 'message': 'Contractor created'}),
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