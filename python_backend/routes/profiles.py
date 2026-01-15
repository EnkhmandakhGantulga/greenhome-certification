from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from models import Profile, User
from schemas import ProfileCreate, ProfileResponse
from routes.auth import get_current_user_id

router = APIRouter()

@router.get("/api/profiles/me")
def get_my_profile(request: Request, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request)
    
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    user = db.query(User).filter(User.id == user_id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {
        "id": profile.id,
        "userId": profile.user_id,
        "role": profile.role,
        "organizationName": profile.organization_name,
        "phoneNumber": profile.phone_number,
        "address": profile.address,
        "email": user.email if user else None,
        "firstName": user.first_name if user else None,
        "lastName": user.last_name if user else None
    }

@router.post("/api/profiles")
def update_profile(data: ProfileCreate, request: Request, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request)
    
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    
    if profile:
        profile.role = data.role
        profile.organization_name = data.organization_name
        profile.phone_number = data.phone_number
        profile.address = data.address
    else:
        profile = Profile(
            user_id=user_id,
            role=data.role,
            organization_name=data.organization_name,
            phone_number=data.phone_number,
            address=data.address
        )
        db.add(profile)
    
    db.commit()
    db.refresh(profile)
    
    return {
        "id": profile.id,
        "userId": profile.user_id,
        "role": profile.role,
        "organizationName": profile.organization_name,
        "phoneNumber": profile.phone_number,
        "address": profile.address
    }
