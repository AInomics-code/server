from abc import ABC, abstractmethod
from typing import Any, Dict

class BaseTool(ABC):
    def __init__(self):
        self.name = self.__class__.__name__
    
    @abstractmethod
    async def execute(self, **kwargs) -> Dict[str, Any]:
        pass
    
    def format_result(self, data: Any) -> Dict[str, Any]:
        return {
            "success": True,
            "data": data,
            "tool": self.name
        }
    
    def format_error(self, error: str) -> Dict[str, Any]:
        return {
            "success": False,
            "error": error,
            "tool": self.name
        }

