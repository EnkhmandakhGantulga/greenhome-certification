from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File as FastAPIFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import uuid
import aiofiles

router = APIRouter()

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/app/uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)

class UploadRequest(BaseModel):
    name: str
    size: int
    contentType: str

class UploadResponse(BaseModel):
    uploadURL: str
    objectPath: str
    headers: dict

@router.post("/api/uploads/request-url")
async def request_upload_url(data: UploadRequest, request: Request):
    file_ext = os.path.splitext(data.name)[1] if "." in data.name else ""
    unique_name = f"{uuid.uuid4()}{file_ext}"
    
    return {
        "uploadURL": f"/api/uploads/file/{unique_name}",
        "objectPath": f"/uploads/{unique_name}",
        "fileName": unique_name,
        "method": "POST",
        "headers": {
            "Content-Type": data.contentType
        }
    }

@router.post("/api/uploads/file/{filename}")
async def upload_file_post(filename: str, request: Request):
    body = await request.body()
    
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(body)
    
    return {
        "success": True,
        "path": f"/uploads/{filename}"
    }

@router.put("/api/uploads/file/{filename}")
async def upload_file_put(filename: str, request: Request):
    body = await request.body()
    
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(body)
    
    return {
        "success": True,
        "path": f"/uploads/{filename}"
    }

@router.get("/uploads/{filename}")
async def get_uploaded_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(file_path)
