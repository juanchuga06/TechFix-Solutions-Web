from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import pyodbc
from database import get_db

# Al usar este prefijo, mantenemos la lógica RESTful para las URLs
router = APIRouter(
    prefix="/ordenes/{folio}/repuestos",
    tags=["Detalles de Orden"]
)

# Modelos Pydantic
class DetalleRepuesto(BaseModel):
    codigo_repuesto: int
    cantidad: int

class DetalleUpdate(BaseModel):
    cantidad: int

# 1. LISTAR DETALLES (GET)
@router.get("/")
def listar_detalles_orden(folio: int, db = Depends(get_db)):
    """Consulta la lista de repuestos asignados a una orden específica."""
    try:
        cursor = db.cursor()
        query = "SELECT * FROM VDA_Detalle_Repuesto WHERE numero_folio = ?"
        cursor.execute(query, (folio,))
        
        filas = cursor.fetchall()
        columnas = [columna[0] for columna in cursor.description]
        detalles = [dict(zip(columnas, fila)) for fila in filas]
        
        return {"detalles": detalles}
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=f"Error en BD: {str(e)}")

# 2. AGREGAR DETALLE (POST)
@router.post("/")
def agregar_detalle_orden(folio: int, repuesto: DetalleRepuesto, db = Depends(get_db)):
    """Inserta un nuevo repuesto a una orden existente."""
    try:
        cursor = db.cursor()
        query = """
            SET XACT_ABORT ON;
            EXEC sp_InsertarDetalleRepuesto @folio=?, @codigo_repuesto=?, @cantidad=?
        """
        cursor.execute(query, (folio, repuesto.codigo_repuesto, repuesto.cantidad))
        db.commit()
        return {"mensaje": f"Repuesto {repuesto.codigo_repuesto} agregado a la orden {folio}"}
    except pyodbc.ProgrammingError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except pyodbc.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

# 3. ACTUALIZAR DETALLE (PUT)
@router.put("/{codigo_repuesto}")
def actualizar_detalle_orden(folio: int, codigo_repuesto: int, detalle: DetalleUpdate, db = Depends(get_db)):
    """Actualiza la cantidad de un repuesto específico usando sp_ActualizarDetalleRepuesto."""
    try:
        cursor = db.cursor()
        query = """
            SET XACT_ABORT ON;
            EXEC sp_ActualizarDetalleRepuesto @folio=?, @codigo_repuesto=?, @nueva_cantidad=?
        """
        cursor.execute(query, (folio, codigo_repuesto, detalle.cantidad))
        db.commit()
        return {"mensaje": f"Cantidad actualizada a {detalle.cantidad} para el repuesto {codigo_repuesto}"}
    except pyodbc.ProgrammingError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except pyodbc.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

# 4. ELIMINAR DETALLE (DELETE)
@router.delete("/{codigo_repuesto}")
def eliminar_detalle_orden(folio: int, codigo_repuesto: int, db = Depends(get_db)):
    """Elimina un repuesto específico de una orden."""
    try:
        cursor = db.cursor()
        query = """
            SET XACT_ABORT ON;
            EXEC sp_EliminarDetalleRepuesto @folio=?, @codigo_repuesto=?
        """
        cursor.execute(query, (folio, codigo_repuesto))
        db.commit()
        return {"mensaje": f"Repuesto {codigo_repuesto} eliminado de la orden {folio}"}
    except pyodbc.ProgrammingError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except pyodbc.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")