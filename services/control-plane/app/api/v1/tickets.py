from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from pydantic import BaseModel

from app.core.db import get_session
from app.core.models import (
    SupportTicket, TicketReply, User,
    TicketStatus, TicketPriority, TicketCategory
)

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
    subject: str
    category: TicketCategory
    priority: TicketPriority
    status: TicketStatus
    created_at: datetime
    updated_at: datetime
    reply_count: int
    has_unread: bool  # Future: track if admin replied

class TicketDetail(BaseModel):
    id: int
    subject: str
    category: TicketCategory
    priority: TicketPriority
    status: TicketStatus
    created_at: datetime
    updated_at: datetime
    replies: List[TicketReplyResponse]

# ============================================================================
# Request Models
# ============================================================================

class CreateTicketRequest(BaseModel):
    subject: str
    category: TicketCategory
    priority: TicketPriority = TicketPriority.MEDIUM
    message: str  # First message

class ReplyRequest(BaseModel):
    message: str

# ============================================================================
# User Endpoints
# ============================================================================

@router.post("/", response_model=TicketDetail)
async def create_ticket(
    ticket_data: CreateTicketRequest,
    session: Session = Depends(get_session)
):
    """Create a new support ticket."""
    # TODO: Get user from auth
    # For now, use a test user
    user = session.exec(select(User).limit(1)).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    # Create ticket
    ticket = SupportTicket(
        user_id=user.id,
        user_email=user.email,
        subject=ticket_data.subject,
        category=ticket_data.category,
        priority=ticket_data.priority,
        status=TicketStatus.OPEN
    )
    
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    
    # Create first reply (user's message)
    first_reply = TicketReply(
        ticket_id=ticket.id,
        author_id=str(user.id),
        author_email=user.email,
        is_admin=False,
        message=ticket_data.message
    )
    
    session.add(first_reply)
    session.commit()
    session.refresh(first_reply)
    
    return TicketDetail(
        id=ticket.id,
        subject=ticket.subject,
        category=ticket.category,
        priority=ticket.priority,
        status=ticket.status,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        replies=[
            TicketReplyResponse(
                id=first_reply.id,
                ticket_id=first_reply.ticket_id,
                author_id=first_reply.author_id,
                author_email=first_reply.author_email,
                is_admin=first_reply.is_admin,
                message=first_reply.message,
                created_at=first_reply.created_at
            )
        ]
    )

@router.get("/", response_model=List[TicketListItem])
async def list_my_tickets(
    status: Optional[TicketStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    session: Session = Depends(get_session)
):
    """List current user's tickets."""
    # TODO: Get user from auth
    user = session.exec(select(User).limit(1)).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    query = select(SupportTicket).where(SupportTicket.user_id == user.id)
    
    if status:
        query = query.where(SupportTicket.status == status)
    
    query = query.order_by(SupportTicket.created_at.desc())
    query = query.offset(skip).limit(limit)
    
    tickets = session.exec(query).all()
    
    # Get reply counts
    result = []
    for ticket in tickets:
        reply_count = len(session.exec(
            select(TicketReply).where(TicketReply.ticket_id == ticket.id)
        ).all())
        
        result.append(TicketListItem(
            id=ticket.id,
            subject=ticket.subject,
            category=ticket.category,
            priority=ticket.priority,
            status=ticket.status,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
            reply_count=reply_count,
            has_unread=False  # TODO: Implement unread tracking
        ))
    
    return result

@router.get("/{ticket_id}", response_model=TicketDetail)
async def get_my_ticket(
    ticket_id: int,
    session: Session = Depends(get_session)
):
    """Get detailed ticket information."""
    # TODO: Get user from auth
    user = session.exec(select(User).limit(1)).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    ticket = session.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Verify ownership
    if ticket.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get all replies
    replies = session.exec(
        select(TicketReply)
        .where(TicketReply.ticket_id == ticket_id)
        .order_by(TicketReply.created_at.asc())
    ).all()
    
    return TicketDetail(
        id=ticket.id,
        subject=ticket.subject,
        category=ticket.category,
        priority=ticket.priority,
        status=ticket.status,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
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

@router.post("/{ticket_id}/reply", response_model=TicketReplyResponse)
async def reply_to_my_ticket(
    ticket_id: int,
    reply: ReplyRequest,
    session: Session = Depends(get_session)
):
    """Reply to own ticket."""
    # TODO: Get user from auth
    user = session.exec(select(User).limit(1)).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
    
    ticket = session.get(SupportTicket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    
    # Verify ownership
    if ticket.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Create reply
    ticket_reply = TicketReply(
        ticket_id=ticket_id,
        author_id=str(user.id),
        author_email=user.email,
        is_admin=False,
        message=reply.message
    )
    
    session.add(ticket_reply)
    
    # Update ticket timestamp
    ticket.updated_at = datetime.utcnow()
    session.add(ticket)
    
    session.commit()
    session.refresh(ticket_reply)
    
    return TicketReplyResponse(
        id=ticket_reply.id,
        ticket_id=ticket_reply.ticket_id,
        author_id=ticket_reply.author_id,
        author_email=ticket_reply.author_email,
        is_admin=ticket_reply.is_admin,
        message=ticket_reply.message,
        created_at=ticket_reply.created_at
    )
