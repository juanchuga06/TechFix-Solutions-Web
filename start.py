"""
Lanzador de TechFix Solutions.

Enciende el API (FastAPI/uvicorn) y el servidor estático del frontend,
abre el navegador en la pantalla de inicio y, cuando se cierra esa
ventana del navegador, apaga todo automáticamente.

Uso:
    venv\\Scripts\\python.exe start.py
"""

import os
import sys
import time
import socket
import shutil
import tempfile
import subprocess
from pathlib import Path

ROOT      = Path(__file__).resolve().parent
BACKEND   = ROOT / "backend"
FRONTEND  = ROOT / "frontend"
API_PORT  = 8000
WEB_PORT  = 5500
INDEX_URL = f"http://localhost:{WEB_PORT}/index.html"

# Usa el Python del venv si el script se corrió con otro intérprete.
def python_ejecutable():
    venv_py = ROOT / "venv" / "Scripts" / "python.exe"
    return str(venv_py) if venv_py.exists() else sys.executable


def esperar_puerto(port, timeout=30):
    """Espera hasta que un puerto local acepte conexiones."""
    inicio = time.time()
    while time.time() - inicio < timeout:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=1):
                return True
        except OSError:
            time.sleep(0.4)
    return False


def ip_wifi():
    """IP de la conexión principal (WiFi/LAN) usada para salir a la red."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))  # no envía nada; solo elige la interfaz
        return s.getsockname()[0]
    except Exception:
        return None
    finally:
        s.close()


def ip_radmin():
    """IP de la VPN Radmin (rango 26.x.x.x)."""
    try:
        _, _, addrs = socket.gethostbyname_ex(socket.gethostname())
        for a in addrs:
            if a.startswith("26."):
                return a
    except Exception:
        pass
    return None


def encontrar_navegador():
    """Devuelve la ruta de Chrome o Edge (modo aplicación)."""
    candidatos = [
        r"%ProgramFiles%\Google\Chrome\Application\chrome.exe",
        r"%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe",
        r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe",
        r"%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe",
        r"%ProgramFiles%\Microsoft\Edge\Application\msedge.exe",
    ]
    for c in candidatos:
        ruta = os.path.expandvars(c)
        if os.path.isfile(ruta):
            return ruta
    return None


def apagar(procs):
    """Termina los procesos (y sus hijos) de forma silenciosa."""
    for p in procs:
        if p is None or p.poll() is not None:
            continue
        try:
            if os.name == "nt":
                subprocess.run(
                    ["taskkill", "/F", "/T", "/PID", str(p.pid)],
                    stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                )
            else:
                p.terminate()
        except Exception:
            pass


def main():
    py = python_ejecutable()
    procs = []

    print("Encendiendo el API...")
    # --host 0.0.0.0: acepta conexiones desde la red/VPN, no solo localhost.
    api = subprocess.Popen(
        [py, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", str(API_PORT)],
        cwd=str(BACKEND),
    )
    procs.append(api)

    print("Encendiendo el frontend...")
    # --bind 0.0.0.0: el servidor estático también queda accesible por la VPN.
    web = subprocess.Popen(
        [py, "-m", "http.server", str(WEB_PORT), "--bind", "0.0.0.0", "--directory", str(FRONTEND)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    procs.append(web)

    esperar_puerto(API_PORT)
    esperar_puerto(WEB_PORT)

    # URLs para compartir: solo la de la VPN Radmin y la del WiFi.
    radmin = ip_radmin()
    wifi   = ip_wifi()
    print("\n" + "=" * 60)
    print("App local:   " + INDEX_URL)
    if radmin:
        print(f"Radmin VPN:  http://{radmin}:{WEB_PORT}/index.html")
    if wifi:
        print(f"WiFi/LAN:    http://{wifi}:{WEB_PORT}/index.html")
    print("=" * 60 + "\n")

    navegador = encontrar_navegador()
    perfil = tempfile.mkdtemp(prefix="techfix_")

    try:
        if navegador:
            print("Abriendo la aplicacion. Cierre la ventana para apagar todo.")
            ventana = subprocess.Popen([
                navegador,
                f"--app={INDEX_URL}",
                f"--user-data-dir={perfil}",
                "--no-first-run",
                "--no-default-browser-check",
            ])
            ventana.wait()  # se desbloquea cuando el usuario cierra la ventana
        else:
            import webbrowser
            print("No se encontro Chrome/Edge. Abriendo el navegador por defecto.")
            print("Presione Ctrl+C en esta ventana para apagar todo.")
            webbrowser.open(INDEX_URL)
            while True:
                time.sleep(1)
    except KeyboardInterrupt:
        pass
    finally:
        print("Apagando servidores...")
        apagar(procs)
        shutil.rmtree(perfil, ignore_errors=True)
        print("Listo.")


if __name__ == "__main__":
    main()
