"""
Utility functions for vector search demos
"""
import json
import boto3
import psycopg2
from config import DB_CONFIG, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY


def get_bedrock_client():
    """Initialize and return Bedrock client"""
    return boto3.client(
        service_name='bedrock-runtime',
        region_name="us-east-1",
        aws_access_key_id="AKIARCKPW5XENCQOSYP6",
        aws_secret_access_key="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"
    )


def get_embedding(text, bedrock_client):
    """
    Get embedding vector from AWS Bedrock Titan
    
    Args:
        text (str): Text to convert to embedding
        bedrock_client: Boto3 Bedrock client
        
    Returns:
        list: Embedding vector of 1024 dimensions, or None if error
    """
    try:
        # Validate input
        if not text or not isinstance(text, str):
            return None
        
        # Clean and validate text
        text = text.strip()
        if not text:
            return None
        
        body = json.dumps({
            "inputText": text
        })
        
        response = bedrock_client.invoke_model(
            modelId='amazon.titan-embed-text-v2:0',
            body=body,
            contentType='application/json',
            accept='application/json'
        )
        
        response_body = json.loads(response['body'].read())
        embedding = response_body.get('embedding')
        
        return embedding
    except Exception as e:
        print(f"❌ Error getting embedding: {e}")
        return None


def get_db_connection():
    """Get PostgreSQL database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        return None


def search_vector_similarity(query_embedding, table, vector_column, id_column, name_column, limit=10, additional_columns=None):
    """
    Search for similar vectors in database
    
    Args:
        query_embedding (list): Query embedding vector
        table (str): Table name
        vector_column (str): Vector column name
        id_column (str): ID column name
        name_column (str): Name column name
        limit (int): Number of results to return
        additional_columns (list): Additional columns to select
        
    Returns:
        list: List of tuples with results
    """
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        cur = conn.cursor()
        
        # Build column list
        columns = [id_column, name_column]
        if additional_columns:
            columns.extend(additional_columns)
        columns_str = ', '.join(columns)
        
        # Build query
        query = f"""
            SELECT 
                {columns_str},
                1 - ({vector_column} <=> %s::vector) as similarity
            FROM {table}
            ORDER BY {vector_column} <=> %s::vector
            LIMIT %s
        """
        
        cur.execute(query, (query_embedding, query_embedding, limit))
        results = cur.fetchall()
        
        cur.close()
        conn.close()
        
        return results
    except Exception as e:
        print(f"❌ Error searching database: {e}")
        if conn:
            conn.close()
        return []

