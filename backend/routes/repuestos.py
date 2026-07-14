from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
import pyodbc

from database import get_db

router = APIRouter(
    prefix="/repuestos",
    tags=["Repuestos"]
)

# --- MODELOS PYDANTIC ---

class RepuestoCreate(BaseModel):
    nombre_pieza: str
    costo_unitario: float = Field(..., gt=0, description="El costo debe ser mayor a 0")

class RepuestoUpdate(RepuestoCreate):
    pass

# --- ENDPOINTS ---

@router.get("/")
def listar_repuestos(db = Depends(get_db)):
    """Lista todos los repuestos del catálogo global."""
    try:
        cursor = db.cursor()
        cursor.execute("SELECT * FROM Repuesto")
        
        # Obtenemos las filas crudas
        filas = cursor.fetchall()
        
        # Extraemos los nombres de las columnas
        columnas = [columna[0] for columna in cursor.description]
        
        # Unimos las columnas con los valores de cada fila para crear diccionarios
        repuestos = [dict(zip(columnas, fila)) for fila in filas]
        
        return {"repuestos": repuestos}
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=f"Error en base de datos: {str(e)}")

@router.post("/")
def crear_repuesto(repuesto: RepuestoCreate, db = Depends(get_db)):
    """Crea un nuevo repuesto ejecutando sp_InsertarRepuesto."""
    try:
        cursor = db.cursor()
        query = """
            SET XACT_ABORT ON;
            EXEC sp_InsertarRepuesto @nombre=?, @costo=?
        """
        cursor.execute(query, (
            repuesto.nombre_pieza,
            repuesto.costo_unitario
        ))
        db.commit()
        return {"mensaje": "Repuesto registrado exitosamente"}
    except pyodbc.ProgrammingError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except pyodbc.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.put("/{codigo}")
def actualizar_repuesto(codigo: int, repuesto: RepuestoUpdate, db = Depends(get_db)):
    """Actualiza un repuesto existente mediante sp_ActualizarRepuesto."""
    try:
        cursor = db.cursor()
        query = """
            SET XACT_ABORT ON;
            EXEC sp_ActualizarRepuesto @codigo=?, @nombre=?, @costo=?
        """
        cursor.execute(query, (
            codigo,
            repuesto.nombre_pieza,
            repuesto.costo_unitario
        ))
        db.commit()
        return {"mensaje": f"Repuesto con código {codigo} actualizado exitosamente"}
    except pyodbc.ProgrammingError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except pyodbc.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.delete("/{codigo}")
def eliminar_repuesto(codigo: int, db = Depends(get_db)):
    """Elimina un repuesto usando sp_EliminarRepuesto."""
    try:
        cursor = db.cursor()
        query = """
        SET XACT_ABORT ON;
        EXEC sp_EliminarRepuesto @codigo=?
        """
        cursor.execute(query, (codigo,))
        db.commit()
        return {"mensaje": f"Repuesto con código {codigo} eliminado exitosamente"}
    except pyodbc.ProgrammingError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except pyodbc.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")