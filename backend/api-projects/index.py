import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Manage projects - get all projects with company and financial details
    Args: event - dict with httpMethod
          context - object with request_id attribute
    Returns: HTTP response with projects list
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
            p.id,
            p.title,
            p.description,
            p.budget,
            p.actual_cost,
            (p.budget - p.actual_cost) as profit,
            p.status,
            p.start_date,
            p.end_date,
            c.name as company_name,
            e.title as estimate_title,
            COUNT(pay.id) as payment_count,
            COALESCE(SUM(pay.amount), 0) as total_paid
        FROM projects p
        LEFT JOIN companies c ON p.company_id = c.id
        LEFT JOIN estimates e ON p.estimate_id = e.id
        LEFT JOIN payments pay ON pay.project_id = p.id
        GROUP BY p.id, c.name, e.title
        ORDER BY p.created_at DESC
    """)
    projects = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps([dict(row) for row in projects], default=str)
    }
