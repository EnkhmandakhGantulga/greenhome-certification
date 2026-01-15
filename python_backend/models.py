from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, unique=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    profile_image_url = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    profile = relationship("Profile", back_populates="user", uselist=False)
    requests = relationship("Request", back_populates="user", foreign_keys="Request.user_id")
    audited_requests = relationship("Request", back_populates="auditor", foreign_keys="Request.auditor_id")

class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    role = Column(String, default="legal_entity", nullable=False)  # legal_entity, admin, auditor
    organization_name = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    address = Column(String, nullable=True)
    
    user = relationship("User", back_populates="profile")

class Request(Base):
    __tablename__ = "requests"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    auditor_id = Column(String, ForeignKey("users.id"), nullable=True)
    
    status = Column(String, default="submitted", nullable=False)
    project_type = Column(String, nullable=False)
    project_area = Column(String, nullable=True)
    location = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    
    price_quote = Column(Integer, nullable=True)
    admin_comment = Column(Text, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="requests", foreign_keys=[user_id])
    auditor = relationship("User", back_populates="audited_requests", foreign_keys=[auditor_id])
    files = relationship("File", back_populates="request")
    audit = relationship("Audit", back_populates="request", uselist=False)

class File(Base):
    __tablename__ = "files"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(Integer, ForeignKey("requests.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    url = Column(String, nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # project_file, contract, audit_report, certificate, other
    
    created_at = Column(DateTime, server_default=func.now())
    
    request = relationship("Request", back_populates="files")
    user = relationship("User")

class Audit(Base):
    __tablename__ = "audits"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(Integer, ForeignKey("requests.id"), unique=True, nullable=False)
    auditor_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    checklist_data = Column(JSON, nullable=True)
    conclusion = Column(Text, nullable=True)
    
    submitted_at = Column(DateTime, server_default=func.now())
    
    request = relationship("Request", back_populates="audit")
    auditor = relationship("User")
