from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
import pyodbc

from database import get_db

router = APIRouter(
    prefix="/ordenes",
    tags=["Órdenes"]
)

# --- MODELOS PYDANTIC ---

class DetalleRepuesto(BaseModel):
    codigo_repuesto: int
    cantidad: int

class OrdenCreate(BaseModel):
    fecha_ingreso: Optional[date] = None
    descripcion_fallo: str
    estado_orden: str
    codigo_tecnico: int
    cedula_cliente: str
    codigo_sede: str  # 'S01' o 'S02'
    # Campos de fragmentación vertical (Orden_labo)
    nivel_encriptacion: Optional[str] = None
    protocolo_seguridad: Optional[str] = None
    horas_laboratorio: Optional[int] = None
    # Lista de repuestos asociados
    repuestos: List[DetalleRepuesto] = []

class OrdenUpdate(BaseModel):
    descripcion_fallo: str
    estado_orden: str
    codigo_tecnico: int
    nivel_encriptacion: Optional[str] = None
    protocolo_seguridad: Optional[str] = None
    horas_laboratorio: Optional[int] = None
    repuestos: Optional[List[DetalleRepuesto]] = []

# --- ENDPOINTS ---

@router.get("/dashboard")
def obtener_dashboard(
    sede: Optional[str] = Query(None, description="Sede a filtrar (S01 o S02). Si se omite, se traen ambas."),
    estado: Optional[str] = Query(None, description="Filtro opcional por estado"),
    fecha: Optional[date] = Query(None, description="Filtro opcional por fecha"),
    db = Depends(get_db)
):
    """
    Ejecuta el SP distribuido para listar el dashboard.
    Si 'sede' se omite, se consultan ambas sedes (S01 y S02) y se unifican
    en una sola lista.
    """
    try:
        cursor = db.cursor()
        query = "EXEC sp_ObtenerDashboardOrdenes @sede_filtro=?, @estado_filtro=?, @fecha_busqueda=?"

        # Una sede concreta, o ambas si no se especifica.
        sedes = [sede] if sede else ["S01", "S02"]

        ordenes = []
        for s in sedes:
            cursor.execute(query, (s, estado, fecha))
            filas = cursor.fetchall()
            columnas = [columna[0] for columna in cursor.description]
            ordenes += [dict(zip(columnas, fila)) for fila in filas]

        return {"ordenes": ordenes}
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=f"Error en base de datos: {str(e)}")

@router.post("/")
def crear_orden_completa(orden: OrdenCreate, db = Depends(get_db)):
    """
    Crea la orden y luego inserta secuencialmente sus repuestos.
    Requiere que sp_InsertarOrden retorne el número de folio generado.
    """
    try:
        cursor = db.cursor()
        
        # 1. Crear la orden (SQL Server maneja aquí el BEGIN DISTRIBUTED TRANSACTION interno)
        query_orden = """
            SET XACT_ABORT ON;
            EXEC sp_InsertarOrden 
                @fecha=?, @fallo=?, @estado=?, @tecnico=?, @cliente=?, @sede=?,
                @encriptacion=?, @protocolo=?, @horas=?
        """
        cursor.execute(query_orden, (
            orden.fecha_ingreso,
            orden.descripcion_fallo,
            orden.estado_orden,
            orden.codigo_tecnico,
            orden.cedula_cliente,
            orden.codigo_sede,
            orden.nivel_encriptacion,
            orden.protocolo_seguridad,
            orden.horas_laboratorio
        ))
        
        # Obtenemos el folio generado (Requiere el SELECT extra en tu SP)
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=500, detail="El SP de la orden no retornó el folio generado.")
        
        nuevo_folio = row[0]
        db.commit() # Confirmamos la orden padre

        # 2. Insertar los detalles de repuestos
        if orden.repuestos:
            query_detalle = """
                SET XACT_ABORT ON;
                EXEC sp_InsertarDetalleRepuesto @folio=?, @codigo_repuesto=?, @cantidad=?
            """
            for repuesto in orden.repuestos:
                cursor.execute(query_detalle, (
                    nuevo_folio,
                    repuesto.codigo_repuesto,
                    repuesto.cantidad
                ))
            db.commit() # Confirmamos los repuestos

        return {"mensaje": "Orden de servicio creada exitosamente", "numero_folio": nuevo_folio}

    except pyodbc.ProgrammingError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except pyodbc.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.put("/{folio}")
def actualizar_orden(folio: int, orden: OrdenUpdate, db = Depends(get_db)):
    """Actualiza una orden existente y las cantidades de sus repuestos."""
    try:
        cursor = db.cursor()
        
        # 1. Actualizar la información general de la orden
        query_orden = """
            SET XACT_ABORT ON;
            EXEC sp_ActualizarOrden 
                @folio=?, @fallo=?, @estado=?, @tecnico=?, @encriptacion=?, @protocolo=?, @horas=?
        """
        cursor.execute(query_orden, (
            folio,
            orden.descripcion_fallo,
            orden.estado_orden,
            orden.codigo_tecnico,
            orden.nivel_encriptacion,
            orden.protocolo_seguridad,
            orden.horas_laboratorio
        ))
        db.commit() # Confirmamos la actualización principal

        # 2. Actualizar las cantidades de los repuestos si vienen en el JSON
        if orden.repuestos:
            query_detalle = """
                SET NOCOUNT ON;
                SET XACT_ABORT ON;
                EXEC sp_ActualizarDetalleRepuesto @folio=?, @codigo_repuesto=?, @nueva_cantidad=?
            """
            for repuesto in orden.repuestos:
                cursor.execute(query_detalle, (
                    folio,
                    repuesto.codigo_repuesto,
                    repuesto.cantidad
                ))
            db.commit() # Confirmamos la actualización de las piezas

        return {"mensaje": f"Orden {folio} y sus detalles actualizados exitosamente"}
        
    except pyodbc.ProgrammingError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except pyodbc.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.delete("/{folio}")
def eliminar_orden(folio: int, db = Depends(get_db)):
    """Elimina una orden en estado 'En Proceso'."""
    try:
        cursor = db.cursor()
        query = """
            SET XACT_ABORT ON;
            EXEC sp_EliminarOrden @folio=?
        """
        cursor.execute(query, (folio,))
        db.commit()
        return {"mensaje": f"Orden {folio} eliminada exitosamente"}
    except pyodbc.ProgrammingError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except pyodbc.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")