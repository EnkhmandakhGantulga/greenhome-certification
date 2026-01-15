from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db
from models import Audit
from schemas import AuditCreate, AuditUpdate
from routes.auth import get_current_user_id

router = APIRouter()

@router.post("/api/requests/{request_id}/audits", status_code=201)
def create_audit(request_id: int, data: AuditCreate, request: Request, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request)
    
    existing = db.query(Audit).filter(Audit.request_id == request_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Audit already exists for this request")
    
    new_audit = Audit(
        request_id=request_id,
        auditor_id=user_id,
        checklist_data=data.checklist_data,
        conclusion=data.conclusion
    )
    
    db.add(new_audit)
    db.commit()
    db.refresh(new_audit)
    
    return {
        "id": new_audit.id,
        "requestId": new_audit.request_id,
        "auditorId": new_audit.auditor_id,
        "checklistData": new_audit.checklist_data,
        "conclusion": new_audit.conclusion,
        "submittedAt": new_audit.submitted_at.isoformat() if new_audit.submitted_at else None
    }

@router.patch("/api/requests/{request_id}/audits")
def update_audit(request_id: int, data: AuditUpdate, request: Request, db: Session = Depends(get_db)):
    user_id = get_current_user_id(request)
    
    audit = db.query(Audit).filter(Audit.request_id == request_id).first()
    
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    if data.checklist_data is not None:
        audit.checklist_data = data.checklist_data
    if data.conclusion is not None:
        audit.conclusion = data.conclusion
    
    db.commit()
    db.refresh(audit)
    
    return {
        "id": audit.id,
        "requestId": audit.request_id,
        "auditorId": audit.auditor_id,
        "checklistData": audit.checklist_data,
        "conclusion": audit.conclusion,
        "submittedAt": audit.submitted_at.isoformat() if audit.submitted_at else None
    }
