from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
import pyodbc

from database import get_db

router = APIRouter(
    prefix="/clientes",
    tags=["Clientes"]
)

# --- MODELOS PYDANTIC ---

class ClienteBase(BaseModel):
    cedula_cliente: str
    nombre_completo: str
    telefono_cliente: str
    correo_cliente: str

# --- ENDPOINTS ---

@router.get("/")
def listar_clientes(db = Depends(get_db)):
    """Lista todos los clientes del catálogo global."""
    try:
        cursor = db.cursor()
        cursor.execute("SELECT * FROM Cliente")

         # Obtenemos las filas crudas
        filas = cursor.fetchall()

        # Extraemos los nombres de las columnas
        columnas = [columna[0] for columna in cursor.description]

        # Unimos las columnas con los valores de cada fila para crear diccionarios
        clientes = [dict(zip(columnas, fila)) for fila in filas]

        return {"clientes": clientes}
    except pyodbc.Error as e:
        raise HTTPException(status_code=500, detail=f"Error en base de datos: {str(e)}")

@router.post("/")
def crear_cliente(cliente: ClienteBase, db = Depends(get_db)):
    """Crea un nuevo cliente ejecutando sp_InsertarCliente."""
    try:
        cursor = db.cursor()
        query = "EXEC sp_InsertarCliente @cedula=?, @nombre=?, @telefono=?, @correo=?"
        cursor.execute(query, (
            cliente.cedula_cliente,
            cliente.nombre_completo,
            cliente.telefono_cliente,
            cliente.correo_cliente
        ))
        db.commit()
        return {"mensaje": "Cliente registrado exitosamente"}
    except pyodbc.ProgrammingError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except pyodbc.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.put("/{cedula}")
def actualizar_cliente(cedula: str, cliente: ClienteBase, db = Depends(get_db)):
    """Actualiza un cliente existente mediante sp_ActualizarCliente."""
    try:
        cursor = db.cursor()
        query = "EXEC sp_ActualizarCliente @cedula=?, @nombre=?, @telefono=?, @correo=?"
        # Usamos la cédula de la URL para asegurar consistencia
        cursor.execute(query, (
            cedula,
            cliente.nombre_completo,
            cliente.telefono_cliente,
            cliente.correo_cliente
        ))
        db.commit()
        return {"mensaje": f"Cliente {cedula} actualizado exitosamente"}
    except pyodbc.ProgrammingError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except pyodbc.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.delete("/{cedula}")
def eliminar_cliente(cedula: str, db = Depends(get_db)):
    """Elimina un cliente usando sp_EliminarCliente."""
    try:
        cursor = db.cursor()
        cursor.execute("EXEC sp_EliminarCliente @cedula=?", (cedula,))
        db.commit()
        return {"mensaje": f"Cliente {cedula} eliminado exitosamente"}
    except pyodbc.ProgrammingError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    except pyodbc.Error as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")