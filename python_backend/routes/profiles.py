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

def ensure_user_exists(request: Request, db: Session) -> str:
    """Ensure user exists in database based on session data."""
    user_id = get_current_user_id(request)
    session_user = request.session.get("user", {})
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(
            id=user_id,
            email=session_user.get("email"),
            first_name=session_user.get("first_name"),
            last_name=session_user.get("last_name")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return user_id

@router.get("/api/profiles/me")
def get_my_profile(request: Request, db: Session = Depends(get_db)):
    user_id = ensure_user_exists(request, db)
    
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
def create_or_update_profile(data: ProfileCreate, request: Request, db: Session = Depends(get_db)):
    user_id = ensure_user_exists(request, db)
    
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    
    if profile:
        profile.role = data.role
        profile.organization_name = data.organizationName
        profile.phone_number = data.phoneNumber
        profile.address = data.address
    else:
        profile = Profile(
            user_id=user_id,
            role=data.role,
            organization_name=data.organizationName,
            phone_number=data.phoneNumber,
            address=data.address
        )
        db.add(profile)
    
    db.commit()
    db.refresh(profile)
    
    user = db.query(User).filter(User.id == user_id).first()
    
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
