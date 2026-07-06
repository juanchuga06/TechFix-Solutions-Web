# Proyecto de Bases de Datos Distribuidas 2026B-2B

- EPN - FIS
- Grupo 5
- Integrantes: Guillermo Cevallos, Juan Chugá, Karen Mosquera

## Tema: “Sistema de Gestión de Órdenes para TechFix Solutions”

Este repositorio contiene todos los elementos necesarios para la implementación de una aplicación web (arquitectura de cliente liviano) que soporta el ingreso, consulta, actualización y eliminación de datos del sistema de gestión de órdenes de TechFix Solutions. La base de datos está distribuida y maneja esquemas de fragmentación (vertical, horizontal primario, horizontal derivada y mixta) y replicación entre dos nodos físicos (Sede Norte S01 y Sede Sur S02). 

El sistema de base de datos se manejó en SQL Server, conectando ambos nodos mediante servidores vinculados a través de una red LAN virtual (Radmin VPN). La aplicación fue desarrollada utilizando Python (FastAPI) para el backend y HTML/CSS/JavaScript para el frontend.

## Estructura del proyecto

La estructura de este proyecto bajo un formato de monorepositorio es la siguiente. A continuación se detallan los ficheros y directorios más importantes:

- **backend:** contiene la lógica del servidor (API REST) desarrollada en Python. Incluye `main.py` para la inicialización del servicio, `database.py` para la conexión a SQL Server vía `pyodbc`, y el directorio `routes/` con las operaciones transaccionales y distribuidas.
- **frontend:** código fuente de la interfaz gráfica implementada en HTML, CSS y JavaScript. Contiene las vistas maquetadas a partir de los mockups (dashboard, clientes, técnicos y repuestos)[cite: 1] y la lógica de consumo de la API dentro de la carpeta `js/`.
- **docs:** incluye los archivos `.pdf` con el diseño distribuido de la base de datos, los esquemas de fragmentación, justificaciones de replicación y el reporte de la práctica[cite: 1].
- **requirements.txt:** listado de librerías y dependencias propias del backend en Python (ej. FastAPI, uvicorn) necesarias para levantar el entorno de desarrollo.
