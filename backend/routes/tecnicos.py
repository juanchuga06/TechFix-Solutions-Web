from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
import pyodbc

# Importamos la dependencia de conexión
from database import get_db

router = APIRouter(
    prefix="/tecnicos",
    tags=["Técnicos"]
)

# --- MODELOS PYDANTIC ---

class TecnicoBase(BaseModel):
    cedula_tecnico: str
    nombre_tecnico: str
    apellido_tecnico: str
    especialidad_tecnico: str

class TecnicoCreate(TecnicoBase):
    codigo_sede: str # 'S01' o 'S02'

class TecnicoUpdate(TecnicoBase):
    pass # Para actualizar no enviamos la sede, según el SP

# --- ENDPOINTS ---

@router.get("/")
def listar_tecnicos(sede: Optional[str] = Query(None, description="Sede a filtrar (S01 o S02). Si se omite, se listan todas."), cedula_tecnico: Optional[str] = None, db = Depends(get_db)):
    """
    Lista los técnicos desde la vista VDA_Tecnico.
    - Si se pasa 'cedula_tecnico', busca ese técnico.
    - Si se pasa 'sede', filtra por esa sede (fragmentación horizontal).
    - Si no se pasa nada, devuelve los técnicos de todas las sedes.
    """
    try:
        cursor = db.cursor()

        if cedula_tecnico:
            cursor.execute("SELECT * FROM VDA_Tecnico WHERE cedula_tecnico = ?", (cedula_tecnico,))
        elif sede:
            cursor.execute("SELECT * FROM VDA_Tecnico WHERE codigo_sede = ?", (sede,))
        else:
            cursor.execute("SELECT * FROM VDA_Tecnico")
        
        # Obtenemos las filas crudas
        filas = cursor.fetchall()

        # Extraemos los nombres de las columnas
        columnas = [columna[0] for columna in cursor.description]

        # Unimos las columnas con los valores de cada fila para crear diccionarios
        tecnicos = [dict(zip(columnas, fila)) for fila in filas]
        
        return {"tecnicos": tecnicos}
    
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=f"Error en base de datos: {str(e)}")

@router.post("/")
def crear_tecnico(tecnico: TecnicoCreate, db = Depends(get_db)):
    """
    Crea un nuevo técnico ejecutando el SP sp_InsertarTecnico.
    """
    try:
        cursor = db.cursor()
        query = """
        SET XACT_ABORT ON;
        EXEC sp_InsertarTecnico @cedula=?, @nombre=?, @apellido=?, @especialidad=?, @sede=?
        """
        cursor.execute(query, (
            tecnico.cedula_tecnico,
            tecnico.nombre_tecnico,
            tecnico.apellido_tecnico,
            tecnico.especialidad_tecnico,
            tecnico.codigo_sede
        ))
        db.commit()
        return {"mensaje": "Técnico registrado exitosamente"}
        
    except pyodbc.ProgrammingError as e:
        db.rollback()
        # Capturamos los errores THROW de SQL Server
        raise HTTPException(status_code=400, detail=str(e))
    except pyodbc.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.put("/{codigo}")
def actualizar_tecnico(codigo: int, tecnico: TecnicoUpdate, db = Depends(get_db)):
    """
    Actualiza la información de un técnico existente usando sp_ActualizarTecnico.
    """
    try:
        cursor = db.cursor()
        query = """
        SET XACT_ABORT ON;
        EXEC sp_ActualizarTecnico @codigo=?, @cedula=?, @nombre=?, @apellido=?, @especialidad=?
        """
        cursor.execute(query, (
            codigo,
            tecnico.cedula_tecnico,
            tecnico.nombre_tecnico,
            tecnico.apellido_tecnico,
            tecnico.especialidad_tecnico
        ))
        db.commit()
        return {"mensaje": f"Técnico con código {codigo} actualizado exitosamente"}
        
    except pyodbc.ProgrammingError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except pyodbc.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.delete("/{codigo}")
def eliminar_tecnico(codigo: int, db = Depends(get_db)):
    """
    Elimina un técnico mediante sp_EliminarTecnico.
    """
    try:
        cursor = db.cursor()
        query = """
            SET XACT_ABORT ON;
            EXEC sp_EliminarTecnico @codigo=?
        """
        cursor.execute(query, (codigo,))
        db.commit()
        return {"mensaje": f"Técnico con código {codigo} eliminado exitosamente"}
        
    except pyodbc.ProgrammingError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except pyodbc.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")