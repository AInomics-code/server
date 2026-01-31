import asyncio
import sys
sys.path.insert(0, '/Users/jeff/Documents/vorta/server/backend')

from services.user_service import get_user_by_email
from auth.jwt import verify_password

async def test_login():
    try:
        print("Buscando usuario...")
        user = await get_user_by_email("admin@vorta.com")
        
        if user:
            print(f"Usuario encontrado: {user.email}")
            print(f"Password hash: {user.password_hash[:30]}...")
            
            print("\nProbando verificación de contraseña...")
            result = verify_password("admin123", user.password_hash)
            print(f"Contraseña correcta: {result}")
        else:
            print("Usuario no encontrado")
            
    except Exception as e:
        print(f"Error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_login())
