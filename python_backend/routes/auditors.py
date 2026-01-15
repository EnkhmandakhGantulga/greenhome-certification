from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import List
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from models import User, Profile
from routes.auth import get_current_user_id

router = APIRouter()

@router.get("/api/auditors")
def list_auditors(request: Request, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request)
    
    auditors = db.query(User).join(Profile).filter(Profile.role == "auditor").all()
    
    return [
        {
            "id": a.id,
            "email": a.email,
            "firstName": a.first_name,
            "lastName": a.last_name
        }
        for a in auditors
    ]
