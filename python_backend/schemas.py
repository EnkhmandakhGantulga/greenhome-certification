from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class UserBase(BaseModel):
    id: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserResponse(UserBase):
    profile_image_url: Optional[str] = None
    
    class Config:
        from_attributes = True

class ProfileBase(BaseModel):
    role: str = "legal_entity"
    organization_name: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None

class ProfileCreate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    id: int
    user_id: str
    
    class Config:
        from_attributes = True

class RequestCreate(BaseModel):
    project_type: str
    project_area: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None

class RequestUpdate(BaseModel):
    status: Optional[str] = None
    project_type: Optional[str] = None
    project_area: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    price_quote: Optional[int] = None
    admin_comment: Optional[str] = None
    auditor_id: Optional[str] = None

class RequestResponse(BaseModel):
    id: int
    user_id: str
    auditor_id: Optional[str] = None
    status: str
    project_type: str
    project_area: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    price_quote: Optional[int] = None
    admin_comment: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    user: Optional[Dict[str, Any]] = None
    auditor: Optional[Dict[str, Any]] = None
    files: Optional[List[Dict[str, Any]]] = None
    audit: Optional[Dict[str, Any]] = None
    
    class Config:
        from_attributes = True

class FileCreate(BaseModel):
    request_id: int
    name: str
    url: str
    type: str

class FileResponse(BaseModel):
    id: int
    request_id: int
    user_id: str
    name: str
    url: str
    type: str
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class AuditCreate(BaseModel):
    checklist_data: Optional[Dict[str, Any]] = None
    conclusion: Optional[str] = None

class AuditUpdate(BaseModel):
    checklist_data: Optional[Dict[str, Any]] = None
    conclusion: Optional[str] = None

class AuditResponse(BaseModel):
    id: int
    request_id: int
    auditor_id: str
    checklist_data: Optional[Dict[str, Any]] = None
    conclusion: Optional[str] = None
    submitted_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class TestUserResponse(BaseModel):
    id: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str
    organization_name: Optional[str] = None

class LoginResponse(BaseModel):
    success: bool
    user: Dict[str, Any]
