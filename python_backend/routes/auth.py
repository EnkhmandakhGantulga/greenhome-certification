from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import os
import uuid
import hashlib

import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from models import User, Profile

router = APIRouter()

class RegisterRequest(BaseModel):
    email: str
    password: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

TEST_USERS = [
    {
        "id": "auditor-001",
        "email": "john.smith@greenhome.mn",
        "first_name": "John",
        "last_name": "Smith",
        "role": "auditor",
        "organization_name": None,
        "password": hash_password("test123")
    },
    {
        "id": "auditor-002", 
        "email": "maria.garcia@greenhome.mn",
        "first_name": "Maria",
        "last_name": "Garcia",
        "role": "auditor",
        "organization_name": None,
        "password": hash_password("test123")
    },
    {
        "id": "auditor-003",
        "email": "david.chen@greenhome.mn", 
        "first_name": "David",
        "last_name": "Chen",
        "role": "auditor",
        "organization_name": None,
        "password": hash_password("test123")
    },
    {
        "id": "legal-001",
        "email": "contact@buildco.mn",
        "first_name": "Батбаяр",
        "last_name": "Ганбат",
        "role": "legal_entity",
        "organization_name": "BuildCo ХХК",
        "password": hash_password("test123")
    },
    {
        "id": "legal-002",
        "email": "info@greenbuilders.mn",
        "first_name": "Оюунтуяа",
        "last_name": "Батсүх",
        "role": "legal_entity",
        "organization_name": "Green Builders ХХК",
        "password": hash_password("test123")
    },
    {
        "id": "admin-001",
        "email": "admin@greenhome.mn",
        "first_name": "Admin",
        "last_name": "User",
        "role": "admin",
        "organization_name": None,
        "password": hash_password("admin123")
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

@router.get("/api/test/users")
def get_test_users(db: Session = Depends(get_db)):
    ensure_test_users_exist(db)
    return [
        {
            "id": u["id"],
            "email": u["email"],
            "firstName": u["first_name"],
            "lastName": u["last_name"],
            "role": u["role"],
            "organizationName": u.get("organization_name")
        }
        for u in TEST_USERS
    ]

@router.post("/api/test/login/{user_id}")
def test_login(user_id: str, request: Request, db: Session = Depends(get_db)):
    ensure_test_users_exist(db)
    
    test_user = next((u for u in TEST_USERS if u["id"] == user_id), None)
    if not test_user:
        raise HTTPException(status_code=404, detail="Test user not found")
    
    request.session["user_id"] = user_id
    request.session["user"] = {
        "id": user_id,
        "sub": user_id,
        "email": test_user["email"],
        "firstName": test_user["first_name"],
        "lastName": test_user["last_name"]
    }
    
    return {
        "success": True,
        "user": request.session["user"]
    }

@router.post("/api/auth/register")
def register(data: RegisterRequest, request: Request, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(data.password)
    
    user = User(
        id=user_id,
        email=data.email,
        first_name=data.firstName,
        last_name=data.lastName
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    request.session["user_id"] = user_id
    request.session["user"] = {
        "id": user_id,
        "sub": user_id,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name
    }
    request.session["password_hash"] = hashed_pw
    
    return {
        "success": True,
        "user": request.session["user"]
    }

@router.post("/api/auth/login")
def login(data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    ensure_test_users_exist(db)
    
    test_user = next((u for u in TEST_USERS if u["email"] == data.email), None)
    if test_user:
        if test_user["password"] == hash_password(data.password):
            request.session["user_id"] = test_user["id"]
            request.session["user"] = {
                "id": test_user["id"],
                "sub": test_user["id"],
                "email": test_user["email"],
                "firstName": test_user["first_name"],
                "lastName": test_user["last_name"]
            }
            return {"success": True, "user": request.session["user"]}
    
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return {"success": True, "user": {
        "id": user.id,
        "email": user.email,
        "firstName": user.first_name,
        "lastName": user.last_name
    }}

@router.get("/api/auth/user")
def get_current_user(request: Request):
    if "user" not in request.session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return request.session["user"]

@router.post("/api/auth/logout")
def logout_post(request: Request):
    request.session.clear()
    return {"success": True}

@router.get("/api/logout")
def logout_redirect(request: Request):
    request.session.clear()
    return RedirectResponse(url="/", status_code=302)

@router.get("/api/login")
def login_redirect():
    return RedirectResponse(url="/test-login", status_code=302)

def get_current_user_id(request: Request) -> str:
    if "user_id" not in request.session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return request.session["user_id"]
