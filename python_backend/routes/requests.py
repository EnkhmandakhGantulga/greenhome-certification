from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload
from typing import List
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from models import Request as RequestModel, Profile, User, File, Audit
from schemas import RequestCreate, RequestUpdate, RequestResponse
from routes.auth import get_current_user_id

router = APIRouter()

def request_to_dict(req: RequestModel, include_relations=True):
    result = {
        "id": req.id,
        "userId": req.user_id,
        "auditorId": req.auditor_id,
        "status": req.status,
        "projectType": req.project_type,
        "projectArea": req.project_area,
        "location": req.location,
        "description": req.description,
        "priceQuote": req.price_quote,
        "adminComment": req.admin_comment,
        "createdAt": req.created_at.isoformat() if req.created_at else None,
        "updatedAt": req.updated_at.isoformat() if req.updated_at else None
    }
    
    if include_relations:
        if req.user:
            result["user"] = {
                "id": req.user.id,
                "email": req.user.email,
                "firstName": req.user.first_name,
                "lastName": req.user.last_name,
                "organizationName": req.user.profile.organization_name if req.user.profile else None
            }
        if req.auditor:
            result["auditor"] = {
                "id": req.auditor.id,
                "email": req.auditor.email,
                "firstName": req.auditor.first_name,
                "lastName": req.auditor.last_name
            }
        if req.files:
            result["files"] = [
                {
                    "id": f.id,
                    "name": f.name,
                    "url": f.url,
                    "type": f.type,
                    "createdAt": f.created_at.isoformat() if f.created_at else None
                }
                for f in req.files
            ]
        if req.audit:
            result["audit"] = {
                "id": req.audit.id,
                "checklistData": req.audit.checklist_data,
                "conclusion": req.audit.conclusion,
                "submittedAt": req.audit.submitted_at.isoformat() if req.audit.submitted_at else None
            }
    
    return result

@router.get("/api/requests")
def list_requests(request: Request, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request)
    
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    role = profile.role if profile else "legal_entity"
    
    query = db.query(RequestModel).options(
        joinedload(RequestModel.user).joinedload(User.profile),
        joinedload(RequestModel.auditor),
        joinedload(RequestModel.files),
        joinedload(RequestModel.audit)
    )
    
    if role == "legal_entity":
        query = query.filter(RequestModel.user_id == user_id)
    elif role == "auditor":
        query = query.filter(RequestModel.auditor_id == user_id)
    
    requests = query.order_by(RequestModel.created_at.desc()).all()
    
    return [request_to_dict(req) for req in requests]

@router.get("/api/requests/{request_id}")
def get_request(request_id: int, request: Request, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request)
    
    req = db.query(RequestModel).options(
        joinedload(RequestModel.user).joinedload(User.profile),
        joinedload(RequestModel.auditor),
        joinedload(RequestModel.files),
        joinedload(RequestModel.audit)
    ).filter(RequestModel.id == request_id).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    return request_to_dict(req)

@router.post("/api/requests", status_code=201)
def create_request(data: RequestCreate, request: Request, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request)
    
    new_request = RequestModel(
        user_id=user_id,
        status="submitted",
        project_type=data.project_type,
        project_area=data.project_area,
        location=data.location,
        description=data.description
    )
    
    db.add(new_request)
    db.commit()
    db.refresh(new_request)
    
    return request_to_dict(new_request, include_relations=False)

@router.patch("/api/requests/{request_id}")
def update_request(request_id: int, data: RequestUpdate, request: Request, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request)
    
    req = db.query(RequestModel).filter(RequestModel.id == request_id).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if data.status is not None:
        req.status = data.status
    if data.project_type is not None:
        req.project_type = data.project_type
    if data.project_area is not None:
        req.project_area = data.project_area
    if data.location is not None:
        req.location = data.location
    if data.description is not None:
        req.description = data.description
    if data.price_quote is not None:
        req.price_quote = data.price_quote
    if data.admin_comment is not None:
        req.admin_comment = data.admin_comment
    if data.auditor_id is not None:
        req.auditor_id = data.auditor_id
    
    db.commit()
    db.refresh(req)
    
    return request_to_dict(req, include_relations=False)
