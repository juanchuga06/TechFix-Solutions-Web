from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importamos los módulos de rutas que desarrollaste
from routes import clientes, repuestos, tecnicos, ordenes

# Inicializamos la aplicación FastAPI
app = FastAPI(
    title="API TechFix - Sistema Distribuido",
    description="Backend para la gestión de la base de datos distribuida de TechFix (S01/S02).",
    version="1.0.0"
)

# --- CONFIGURACIÓN DE CORS ---
# Esto es crítico para que las interfaces HTML de Karen puedan hacer peticiones 'fetch'
# sin ser bloqueadas por las políticas de seguridad del navegador.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción se cambiaría por el dominio del frontend
    allow_credentials=True,
    allow_methods=["*"],  # Permite GET, POST, PUT, DELETE
    allow_headers=["*"],
)

# --- REGISTRO DE RUTAS ---
# Conectamos tus módulos CRUD a la aplicación principal
app.include_router(clientes.router)
app.include_router(repuestos.router)
app.include_router(tecnicos.router)
app.include_router(ordenes.router)

@app.get("/")
def home():
    """Ruta raíz para verificar que el servidor está levantado."""
    return {"mensaje": "El servidor de TechFix está en línea. Visita /docs para la documentación de la API."}