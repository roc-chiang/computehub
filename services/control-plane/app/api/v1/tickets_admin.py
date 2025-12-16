from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select, func, or_
from pydantic import BaseModel

from app.core.db import get_session
from app.core.models import (
    SupportTicket, TicketReply, User,
    TicketStatus, TicketPriority, TicketCategory
)
from app.api.v1.audit import create_audit_log

router = APIRouter()

# ============================================================================
# Response Models
# ============================================================================

class TicketReplyResponse(BaseModel):
    id: int
    ticket_id: int
    author_id: str
    author_email: str
    is_admin: bool
    message: str
    created_at: datetime

class TicketListItem(BaseModel):
    id: int
    user_id: int
    user_email: str
    subject: str
    category: TicketCategory
    priority: TicketPriority
    status: TicketStatus
    assigned_to: Optional[str]
    created_at: datetime
    updated_at: datetime
    reply_count: int

class TicketDetail(BaseModel):
    id: int
    user_id: int
    user_email: str
    subject: str
    category: TicketCategory
    priority: TicketPriority
    status: TicketStatus
    assigned_to: Optional[str]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    closed_at: Optional[datetime]
    replies: List[TicketReplyResponse]

class TicketStats(BaseModel):
    total: int
    open: int
    in_progress: int
    resolved: int
    closed: int
    avg_response_time_hours: Optional[float]

# ============================================================================
# Request Models
# ============================================================================

class TicketUpdateRequest(BaseModel):
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    assigned_to: Optional[str] = None

class ReplyRequest(BaseModel):
    message: str

# ============================================================================
# Admin Endpoints
# ============================================================================

@router.get("/tickets/stats", response_model=TicketStats)
async def get_ticket_stats(session: Session = Depends(get_session)):
    """Get ticket statistics."""
    total = session.exec(select(func.count(SupportTicket.id))).one()
    open_count = session.exec(
        select(func.count(SupportTicket.id)).where(SupportTicket.status == TicketStatus.OPEN)
    ).one()
    in_progress = session.exec(
        select(func.count(SupportTicket.id)).where(SupportTicket.status == TicketStatus.IN_PROGRESS)
    ).one()
    resolved = session.exec(
        select(func.count(SupportTicket.id)).where(SupportTicket.status == TicketStatus.RESOLVED)
    ).one()
    closed = session.exec(
        select(func.count(SupportTicket.id)).where(SupportTicket.status == TicketStatus.CLOSED)
    ).one()
    
    # Calculate average response time (simplified - time to first reply)
    # TODO: Implement proper response time calculation
    avg_response_time = None
    
    return TicketStats(
        total=total,
        open=open_count,
        in_progress=in_progress,
        resolved=resolved,
        closed=closed,
        avg_response_time_hours=avg_response_time
    )

@router.get("/tickets", response_model=List[TicketListItem])
async def list_tickets(
    status: Optional[TicketStatus] = None,
    priority: Optional[TicketPriority] = None,
    category: Optional[TicketCategory] = None,
    assigned_to: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    session: Session = Depends(get_session)
):
    """List all support tickets with filtering."""
    query = select(SupportTicket)
    
    # Apply filters
    if status:
        query = query.where(SupportTicket.status == status)
    if priority:
        query = query.where(SupportTicket.priority == priority)
    if category:
        query = query.where(SupportTicket.category == category)
    if assigned_to:
        query = query.where(SupportTicket.assigned_to == assigned_to)
    if search:
        query = query.where(
            or_(
                SupportTicket.subject.contains(search),
                SupportTicket.user_email.contains(search)
            )
        )
    
    # Order by created_at desc
    query = query.order_by(SupportTicket.created_at.desc())
    query = query.offset(skip).limit(limit)
    
    tickets = session.exec(query).all()
    
    # Get reply counts
    result = []
    for ticket in tickets:
        reply_count = session.exec(
            select(func.count(TicketReply.id)).where(TicketReply.ticket_id == ticket.id)
        ).one()
        
        result.append(TicketListItem(
            id=ticket.id,
            user_id=ticket.user_id,
            user_email=ticket.user_email,
            subject=ticket.subject,
            category=ticket.category,
            priority=ticket.priority,
            status=ticket.status,
            assigned_to=ticket.assigned_to,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
            reply_count=reply_count
        ))
    
    return result

@router.get("/tickets/{ticket_id}", response_model=TicketDetail)
async def get_ticket_detail(
    ticket_id: int,
    session: Session = Depends(get_session)
):
    """Get detailed ticket information with all replies."""
    ticket = session.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Get all replies
    replies = session.exec(
        select(TicketReply)
        .where(TicketReply.ticket_id == ticket_id)
        .order_by(TicketReply.created_at.asc())
    ).all()
    
    return TicketDetail(
        id=ticket.id,
        user_id=ticket.user_id,
        user_email=ticket.user_email,
        subject=ticket.subject,
        category=ticket.category,
        priority=ticket.priority,
        status=ticket.status,
        assigned_to=ticket.assigned_to,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        resolved_at=ticket.resolved_at,
        closed_at=ticket.closed_at,
        replies=[
            TicketReplyResponse(
                id=r.id,
                ticket_id=r.ticket_id,
                author_id=r.author_id,
                author_email=r.author_email,
                is_admin=r.is_admin,
                message=r.message,
                created_at=r.created_at
            ) for r in replies
        ]
    )

@router.patch("/tickets/{ticket_id}", response_model=TicketDetail)
async def update_ticket(
    ticket_id: int,
    update: TicketUpdateRequest,
    session: Session = Depends(get_session)
):
    """Update ticket status, priority, or assignment."""
    ticket = session.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Track changes for audit
    changes = {}
    
    if update.status is not None and update.status != ticket.status:
        old_status = ticket.status
        ticket.status = update.status
        changes["status"] = f"{old_status} -> {update.status}"
        
        # Update timestamps
        if update.status == TicketStatus.RESOLVED:
            ticket.resolved_at = datetime.utcnow()
        elif update.status == TicketStatus.CLOSED:
            ticket.closed_at = datetime.utcnow()
    
    if update.priority is not None and update.priority != ticket.priority:
        changes["priority"] = f"{ticket.priority} -> {update.priority}"
        ticket.priority = update.priority
    
    if update.assigned_to is not None and update.assigned_to != ticket.assigned_to:
        changes["assigned_to"] = f"{ticket.assigned_to} -> {update.assigned_to}"
        ticket.assigned_to = update.assigned_to
    
    ticket.updated_at = datetime.utcnow()
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    
    # Create audit log
    if changes:
        await create_audit_log(
            session=session,
            action_type="UPDATE",
            resource_type="ticket",
            resource_id=str(ticket.id),
            description=f"Updated ticket #{ticket.id}",
            details=changes,
            user_id="admin",  # TODO: Get from auth
            user_email="admin@computehub.com",
            is_admin=True,
            status="success"
        )
    
    # Get replies for response
    replies = session.exec(
        select(TicketReply)
        .where(TicketReply.ticket_id == ticket_id)
        .order_by(TicketReply.created_at.asc())
    ).all()
    
    return TicketDetail(
        id=ticket.id,
        user_id=ticket.user_id,
        user_email=ticket.user_email,
        subject=ticket.subject,
        category=ticket.category,
        priority=ticket.priority,
        status=ticket.status,
        assigned_to=ticket.assigned_to,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        resolved_at=ticket.resolved_at,
        closed_at=ticket.closed_at,
        replies=[
            TicketReplyResponse(
                id=r.id,
                ticket_id=r.ticket_id,
                author_id=r.author_id,
                author_email=r.author_email,
                is_admin=r.is_admin,
                message=r.message,
                created_at=r.created_at
            ) for r in replies
        ]
    )

@router.post("/tickets/{ticket_id}/reply", response_model=TicketReplyResponse)
async def reply_to_ticket(
    ticket_id: int,
    reply: ReplyRequest,
    session: Session = Depends(get_session)
):
    """Admin reply to a ticket."""
    ticket = session.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Create reply
    ticket_reply = TicketReply(
        ticket_id=ticket_id,
        author_id="admin",  # TODO: Get from auth
        author_email="admin@computehub.com",
        is_admin=True,
        message=reply.message
    )
    
    session.add(ticket_reply)
    
    # Update ticket timestamp
    ticket.updated_at = datetime.utcnow()
    session.add(ticket)
    
    session.commit()
    session.refresh(ticket_reply)
    
    # Create audit log
    await create_audit_log(
        session=session,
        action_type="CREATE",
        resource_type="ticket_reply",
        resource_id=str(ticket_reply.id),
        description=f"Admin replied to ticket #{ticket_id}",
        details={"ticket_id": ticket_id, "message_length": len(reply.message)},
        user_id="admin",
        user_email="admin@computehub.com",
        is_admin=True,
        status="success"
    )
    
    return TicketReplyResponse(
        id=ticket_reply.id,
        ticket_id=ticket_reply.ticket_id,
        author_id=ticket_reply.author_id,
        author_email=ticket_reply.author_email,
        is_admin=ticket_reply.is_admin,
        message=ticket_reply.message,
        created_at=ticket_reply.created_at
    )
