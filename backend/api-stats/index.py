import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get dashboard statistics for projects, finances, and contractors
    Args: event - dict with httpMethod
          context - object with request_id attribute
    Returns: HTTP response with dashboard stats
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
            COUNT(*) as total_projects,
            COUNT(*) FILTER (WHERE status = 'in_progress') as active_projects,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_projects,
            COALESCE(SUM(budget), 0) as total_budget,
            COALESCE(SUM(actual_cost), 0) as total_spent,
            COALESCE(SUM(budget - actual_cost), 0) as total_profit
        FROM projects
    """)
    project_stats = cur.fetchone()
    
    cur.execute("""
        SELECT COUNT(*) as total_contractors
        FROM contractors
    """)
    contractor_stats = cur.fetchone()
    
    cur.execute("""
        SELECT 
            COUNT(*) as total_estimates,
            COUNT(*) FILTER (WHERE status = 'draft') as draft_estimates,
            COUNT(*) FILTER (WHERE status = 'approved') as approved_estimates,
            COALESCE(SUM(estimated_cost), 0) as total_estimated
        FROM estimates
    """)
    estimate_stats = cur.fetchone()
    
    cur.execute("""
        SELECT 
            COALESCE(SUM(amount), 0) as total_payments,
            COUNT(*) as payment_count,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_payments
        FROM payments
    """)
    payment_stats = cur.fetchone()
    
    cur.execute("""
        SELECT 
            p.title,
            p.budget,
            p.actual_cost,
            (p.budget - p.actual_cost) as profit,
            p.status
        FROM projects p
        ORDER BY p.created_at DESC
        LIMIT 5
    """)
    recent_projects = cur.fetchall()
    
    cur.execute("""
        SELECT 
            DATE_TRUNC('month', payment_date) as month,
            SUM(amount) as total
        FROM payments
        WHERE payment_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', payment_date)
        ORDER BY month
    """)
    monthly_payments = cur.fetchall()
    
    cur.close()
    conn.close()
    
    stats = {
        'projects': dict(project_stats),
        'contractors': dict(contractor_stats),
        'estimates': dict(estimate_stats),
        'payments': dict(payment_stats),
        'recent_projects': [dict(row) for row in recent_projects],
        'monthly_payments': [{'month': row['month'].isoformat() if row['month'] else None, 'total': float(row['total'])} for row in monthly_payments]
    }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps(stats, default=str)
    }
