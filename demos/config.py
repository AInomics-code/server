"""
Configuration module for demo scripts
"""
import os
from pathlib import Path

# Get the path to the .env file in the parent directory
env_path = Path(__file__).parent.parent / '.env'

# Load environment variables from .env file
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                os.environ[key] = value

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': '5432',
    'database': os.environ.get('POSTGRES_DB', 'main_db'),
    'user': os.environ.get('POSTGRES_USER', 'postgres'),
    'password': os.environ.get('POSTGRES_PASSWORD', 'postgres123')
}

# AWS Bedrock configuration
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID', 'AKIARCKPW5XENCQOSYP6')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY', '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')
BEDROCK_MODEL_ID = 'amazon.titan-embed-text-v2:0'

