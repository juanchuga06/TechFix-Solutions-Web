import os
from pathlib import Path
import pyodbc
from fastapi import HTTPException
from dotenv import load_dotenv

# Carga el .env que está junto a este archivo, sin importar desde qué
# carpeta se ejecute uvicorn (evita que las credenciales queden en None).
load_dotenv(Path(__file__).resolve().parent / ".env")

# Leemos las credenciales. Si no las encuentra, devolverá None.
SERVER = os.getenv("DB_SERVER")
DATABASE = os.getenv("DB_DATABASE")
USERNAME = os.getenv("DB_USERNAME")
PASSWORD = os.getenv("DB_PASSWORD")

# La cadena de conexión se arma dinámicamente con las variables inyectadas
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