from fastapi import APIRouter, Depends, HTTPException
import pyodbc

from database import get_db

router = APIRouter(
    prefix="/sedes",
    tags=["Sedes"]
)

# --- ENDPOINTS ---

@router.get("/")
def listar_sedes(db = Depends(get_db)):
    """Consulta la lista de sedes"""
    try:
        cursor = db.cursor()
        cursor.execute("SELECT * FROM Sede")

        filas = cursor.fetchall()

        columnas = [columna[0] for columna in cursor.description]

        sedes = [dict(zip(columnas, fila)) for fila in filas]

        return {"sedes": sedes}
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=f"Error en base de datos: {str(e)}")
