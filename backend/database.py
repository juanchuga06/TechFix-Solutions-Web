import pyodbc
from fastapi import HTTPException

SERVER = r'Kuro\SQL2025' # O la IP del servidor SQL Server
DATABASE = 'TechFixS02' # O TechFixS02 dependiendo desde dónde levantes la API
USERNAME = 'sa'
PASSWORD = 'guille'

# Cadena de conexión usando el driver más reciente recomendado
CONNECTION_STRING = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={SERVER};DATABASE={DATABASE};UID={USERNAME};PWD={PASSWORD}"

def get_db():
    """Generador de dependencias para la conexión a SQL Server."""
    try:
        conn = pyodbc.connect(CONNECTION_STRING)
        yield conn
    except pyodbc.Error as e:
        print(f"Error de conexión: {e}")
        raise HTTPException(status_code=500, detail="Error conectando a la base de datos")
    finally:
        # Asegura que la conexión se cierre al finalizar la petición
        if 'conn' in locals():
            conn.close()