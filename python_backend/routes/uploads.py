from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
import os
import httpx
import uuid

router = APIRouter()

class UploadRequest(BaseModel):
    name: str
    size: int
    contentType: str

async def get_gcs_credentials():
    hostname = os.environ.get("REPLIT_CONNECTORS_HOSTNAME")
    x_replit_token = None
    
    if os.environ.get("REPL_IDENTITY"):
        x_replit_token = "repl " + os.environ["REPL_IDENTITY"]
    elif os.environ.get("WEB_REPL_RENEWAL"):
        x_replit_token = "depl " + os.environ["WEB_REPL_RENEWAL"]
    
    if not x_replit_token or not hostname:
        return None
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://{hostname}/api/v2/connection?include_secrets=true&connector_names=object_storage",
            headers={
                "Accept": "application/json",
                "X_REPLIT_TOKEN": x_replit_token
            }
        )
        data = response.json()
        return data.get("items", [{}])[0] if data.get("items") else None

@router.post("/api/uploads/request-url")
async def request_upload_url(data: UploadRequest, request: Request):
    bucket_id = os.environ.get("DEFAULT_OBJECT_STORAGE_BUCKET_ID")
    
    if not bucket_id:
        raise HTTPException(status_code=500, detail="Object storage not configured")
    
    file_ext = os.path.splitext(data.name)[1] if "." in data.name else ""
    unique_name = f"{uuid.uuid4()}{file_ext}"
    object_path = f"uploads/{unique_name}"
    
    credentials = await get_gcs_credentials()
    
    if not credentials:
        raise HTTPException(status_code=500, detail="Could not get storage credentials")
    
    settings = credentials.get("settings", {})
    access_token = settings.get("access_token") or settings.get("oauth", {}).get("credentials", {}).get("access_token")
    
    if not access_token:
        raise HTTPException(status_code=500, detail="Could not get access token")
    
    upload_url = f"https://storage.googleapis.com/upload/storage/v1/b/{bucket_id}/o?uploadType=media&name={object_path}"
    
    return {
        "uploadURL": upload_url,
        "objectPath": f"/objects/{object_path}",
        "headers": {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": data.contentType
        }
    }

@router.get("/objects/{path:path}")
async def get_object(path: str):
    bucket_id = os.environ.get("DEFAULT_OBJECT_STORAGE_BUCKET_ID")
    
    if not bucket_id:
        raise HTTPException(status_code=500, detail="Object storage not configured")
    
    credentials = await get_gcs_credentials()
    
    if not credentials:
        raise HTTPException(status_code=500, detail="Could not get storage credentials")
    
    settings = credentials.get("settings", {})
    access_token = settings.get("access_token") or settings.get("oauth", {}).get("credentials", {}).get("access_token")
    
    download_url = f"https://storage.googleapis.com/storage/v1/b/{bucket_id}/o/{path.replace('/', '%2F')}?alt=media"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            download_url,
            headers={"Authorization": f"Bearer {access_token}"},
            follow_redirects=True
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="File not found")
        
        from fastapi.responses import Response
        return Response(
            content=response.content,
            media_type=response.headers.get("content-type", "application/octet-stream")
        )
