from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Vector DB (main_db) - Solo para búsquedas vectoriales
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "main_db"
    postgres_user: str = "postgres"
    postgres_password: str = "postgres123"
    
    # Client Data DB - Datos reales (inventario, ventas, etc)
    client_data_host: str = "localhost"
    client_data_port: int = 5432
    client_data_db: str = "client_data"
    client_data_user: str = "postgres"
    client_data_password: str = "postgres123"
    
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""
    
    aws_region: str = "us-east-1"
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    
    bedrock_model_id: str = "anthropic.claude-3-5-sonnet-20241022-v2:0"
    classifier_model_id: str = "anthropic.claude-3-haiku-20240307-v1:0"
    
    session_ttl_seconds: int = 2700  # 45 minutes
    max_session_ttl_seconds: int = 86400  # 24 hours
    
    # Environment
    environment: str = "development"  # development, staging, production
    
    # LangSmith Tracing
    langchain_tracing_v2: str = "false"
    langchain_api_key: str = ""
    langchain_project: str = "vorta-agent"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings():
    return Settings()

