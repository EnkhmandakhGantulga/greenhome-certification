import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Request, Response
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from starlette.middleware.sessions import SessionMiddleware
import uvicorn
import httpx

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

DIST_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist", "public")
VITE_DEV_SERVER = "http://localhost:5173"
IS_DEV = os.environ.get("NODE_ENV") != "production"

assets_path = os.path.join(DIST_PATH, "assets")
if os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

@app.get("/favicon.png")
async def favicon():
    favicon_path = os.path.join(DIST_PATH, "favicon.png")
    if os.path.exists(favicon_path):
        return FileResponse(favicon_path)
    from fastapi import HTTPException
    raise HTTPException(status_code=404)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.api_route("/{full_path:path}", methods=["GET", "HEAD"])
async def serve_spa(full_path: str, request: Request):
    if full_path.startswith("api") or full_path.startswith("objects"):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    
    if IS_DEV:
        try:
            async with httpx.AsyncClient() as client:
                vite_url = f"{VITE_DEV_SERVER}/{full_path}"
                headers = dict(request.headers)
                headers.pop("host", None)
                
                response = await client.request(
                    method=request.method,
                    url=vite_url,
                    headers=headers,
                    follow_redirects=True,
                    timeout=30.0
                )
                
                excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
                response_headers = {
                    k: v for k, v in response.headers.items() 
                    if k.lower() not in excluded_headers
                }
                
                return Response(
                    content=response.content,
                    status_code=response.status_code,
                    headers=response_headers,
                    media_type=response.headers.get("content-type")
                )
        except Exception as e:
            pass
    
    index_path = os.path.join(DIST_PATH, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return HTMLResponse(content="""
    <!DOCTYPE html>
    <html>
    <head><title>GreenHome</title></head>
    <body>
        <h1>GreenHome - Development Mode</h1>
        <p>Frontend not available. Please build the frontend or start the Vite dev server.</p>
        <p><a href="/api/test/users">View Test Users API</a></p>
    </body>
    </html>
    """)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
