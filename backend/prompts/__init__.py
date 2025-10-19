"""
Prompt management module

Loads prompts from text files for better maintainability.
"""
from pathlib import Path

PROMPTS_DIR = Path(__file__).parent


def load_prompt(filename: str) -> str:
    """Load a prompt from a text file"""
    prompt_path = PROMPTS_DIR / filename
    if not prompt_path.exists():
        raise FileNotFoundError(f"Prompt file not found: {filename}")
    
    return prompt_path.read_text(encoding="utf-8").strip()

