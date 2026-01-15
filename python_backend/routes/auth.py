from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session
from typing import List
import os

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from models import User, Profile
from schemas import TestUserResponse, LoginResponse

router = APIRouter()

TEST_USERS = [
    {
        "id": "auditor-001",
        "email": "john.smith@greenhome.mn",
        "first_name": "John",
        "last_name": "Smith",
        "role": "auditor",
        "organization_name": None
    },
    {
        "id": "auditor-002", 
        "email": "maria.garcia@greenhome.mn",
        "first_name": "Maria",
        "last_name": "Garcia",
        "role": "auditor",
        "organization_name": None
    },
    {
        "id": "auditor-003",
        "email": "david.chen@greenhome.mn", 
        "first_name": "David",
        "last_name": "Chen",
        "role": "auditor",
        "organization_name": None
    },
    {
        "id": "legal-001",
        "email": "contact@buildco.mn",
        "first_name": "Батбаяр",
        "last_name": "Ганбат",
        "role": "legal_entity",
        "organization_name": "BuildCo ХХК"
    },
    {
        "id": "legal-002",
        "email": "info@greenbuilders.mn",
        "first_name": "Оюунтуяа",
        "last_name": "Батсүх",
        "role": "legal_entity",
        "organization_name": "Green Builders ХХК"
    },
    {
        "id": "admin-001",
        "email": "admin@greenhome.mn",
        "first_name": "Admin",
        "last_name": "User",
        "role": "admin",
        "organization_name": None
    }
]

def ensure_test_users_exist(db: Session):
    for test_user in TEST_USERS:
        user = db.query(User).filter(User.id == test_user["id"]).first()
        if not user:
            user = User(
                id=test_user["id"],
                email=test_user["email"],
                first_name=test_user["first_name"],
                last_name=test_user["last_name"]
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        profile = db.query(Profile).filter(Profile.user_id == test_user["id"]).first()
        if not profile:
            profile = Profile(
                user_id=test_user["id"],
                role=test_user["role"],
                organization_name=test_user.get("organization_name")
            )
            db.add(profile)
            db.commit()

@router.get("/api/test/users", response_model=List[TestUserResponse])
def get_test_users(db: Session = Depends(get_db)):
    ensure_test_users_exist(db)
    return TEST_USERS

@router.post("/api/test/login/{user_id}")
def test_login(user_id: str, request: Request, response: Response, db: Session = Depends(get_db)):
    ensure_test_users_exist(db)
    
    test_user = next((u for u in TEST_USERS if u["id"] == user_id), None)
    if not test_user:
        raise HTTPException(status_code=404, detail="Test user not found")
    
    request.session["user_id"] = user_id
    request.session["user"] = {
        "sub": user_id,
        "email": test_user["email"],
        "first_name": test_user["first_name"],
        "last_name": test_user["last_name"]
    }
    
    return {
        "success": True,
        "user": request.session["user"]
    }

@router.get("/api/auth/user")
def get_current_user(request: Request):
    if "user" not in request.session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return request.session["user"]

@router.post("/api/auth/logout")
def logout(request: Request):
    request.session.clear()
    return {"success": True}

def get_current_user_id(request: Request) -> str:
    if "user_id" not in request.session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return request.session["user_id"]
