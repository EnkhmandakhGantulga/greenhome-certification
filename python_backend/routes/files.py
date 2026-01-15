from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from models import File
from schemas import FileCreate, FileResponse
from routes.auth import get_current_user_id

router = APIRouter()

@router.get("/api/requests/{request_id}/files")
def list_files(request_id: int, request: Request, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request)
    
    files = db.query(File).filter(File.request_id == request_id).all()
    
    return [
        {
            "id": f.id,
            "requestId": f.request_id,
            "userId": f.user_id,
            "name": f.name,
            "url": f.url,
            "type": f.type,
            "createdAt": f.created_at.isoformat() if f.created_at else None
        }
        for f in files
    ]

@router.post("/api/files", status_code=201)
def create_file(data: FileCreate, request: Request, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request)
    
    new_file = File(
        request_id=data.requestId,
        user_id=user_id,
        name=data.name,
        url=data.url,
        type=data.type
    )
    
    db.add(new_file)
    db.commit()
    db.refresh(new_file)
    
    return {
        "id": new_file.id,
        "requestId": new_file.request_id,
        "userId": new_file.user_id,
        "name": new_file.name,
        "url": new_file.url,
        "type": new_file.type,
        "createdAt": new_file.created_at.isoformat() if new_file.created_at else None
    }
