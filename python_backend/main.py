import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from starlette.middleware.sessions import SessionMiddleware
import uvicorn

from database import engine, Base
from routes import auth, profiles, requests, files, audits, auditors, uploads

Base.metadata.create_all(bind=engine)

app = FastAPI(title="GreenHome API", version="1.0.0")

session_secret = os.environ.get("SESSION_SECRET", "greenhome-dev-secret-key-change-in-production")
app.add_middleware(SessionMiddleware, secret_key=session_secret)

app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(requests.router)
app.include_router(files.router)
app.include_router(audits.router)
app.include_router(auditors.router)
app.include_router(uploads.router)

DIST_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist")
PUBLIC_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "client", "public")

if os.path.exists(os.path.join(DIST_PATH, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_PATH, "assets")), name="assets")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if full_path.startswith("api/") or full_path.startswith("objects/"):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    
    index_path = os.path.join(DIST_PATH, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return HTMLResponse(content="""
    <!DOCTYPE html>
    <html>
    <head><title>GreenHome</title></head>
    <body>
        <h1>GreenHome - Development Mode</h1>
        <p>Frontend not built yet. Please run the Vite dev server or build the frontend.</p>
        <p><a href="/api/test/users">View Test Users API</a></p>
    </body>
    </html>
    """)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
