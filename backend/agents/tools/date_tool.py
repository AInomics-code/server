"""
Date and time tools for agents
"""
from langchain_core.tools import tool
from datetime import datetime


@tool
def get_current_date() -> str:
    """
    Get the current date and time.
    
    Use this when you need:
    - Precise current timestamp
    - Calculate relative dates (e.g., "last week", "yesterday")
    - Verify what "today" is
    
    Returns: Current date in format 'YYYY-MM-DD HH:MM:SS'
    """
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

