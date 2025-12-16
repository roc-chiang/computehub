"""
Create sample support tickets for testing
"""
import sys
import os
from datetime import datetime, timedelta
import random

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from app.core.db import engine
from app.core.models import (
    User, SupportTicket, TicketReply,
    TicketStatus, TicketPriority, TicketCategory
)

def create_sample_tickets():
    with Session(engine) as session:
        # Get first user
        user = session.exec(select(User).limit(1)).first()
        if not user:
            print("No users found. Please create a user first.")
            return
        
        print(f"Creating tickets for user: {user.email}")
        
        # Sample tickets data
        tickets_data = [
            {
                "subject": "Cannot access deployment dashboard",
                "category": TicketCategory.TECHNICAL,
                "priority": TicketPriority.HIGH,
                "status": TicketStatus.OPEN,
                "message": "I'm unable to access my deployment dashboard. The page keeps loading but never displays any content. I've tried refreshing multiple times.",
            },
            {
                "subject": "Billing question about GPU hours",
                "category": TicketCategory.BILLING,
                "priority": TicketPriority.MEDIUM,
                "status": TicketStatus.IN_PROGRESS,
                "message": "I noticed I was charged for 10 GPU hours but I only used 8 hours according to my logs. Can you help clarify this?",
                "admin_reply": "Thank you for reaching out. I'm looking into your billing records now. I'll get back to you within 24 hours with a detailed breakdown.",
            },
            {
                "subject": "Feature request: Auto-scaling support",
                "category": TicketCategory.FEATURE_REQUEST,
                "priority": TicketPriority.LOW,
                "status": TicketStatus.RESOLVED,
                "message": "It would be great if deployments could auto-scale based on load. This would help optimize costs.",
                "admin_reply": "Thank you for the suggestion! We've added this to our roadmap for Q2 2024. We'll notify you when this feature is available.",
                "user_reply": "Great! Looking forward to it.",
            },
            {
                "subject": "Deployment stuck in 'Creating' status",
                "category": TicketCategory.BUG_REPORT,
                "priority": TicketPriority.URGENT,
                "status": TicketStatus.RESOLVED,
                "message": "My deployment has been stuck in 'Creating' status for over 30 minutes. Deployment ID: 123",
                "admin_reply": "I've identified the issue - there was a problem with the provider API. I've manually restarted your deployment and it should be running now.",
                "user_reply": "Thank you! It's working now.",
            },
            {
                "subject": "How to use custom Docker images?",
                "category": TicketCategory.OTHER,
                "priority": TicketPriority.MEDIUM,
                "status": TicketStatus.CLOSED,
                "message": "I'd like to use my own Docker image instead of the default ones. Is this possible?",
                "admin_reply": "Yes! You can specify a custom Docker image in the deployment settings. Check out our documentation at /docs/custom-images for detailed instructions.",
                "user_reply": "Perfect, thank you!",
            },
        ]
        
        created_count = 0
        
        for i, ticket_data in enumerate(tickets_data):
            # Create ticket
            created_at = datetime.utcnow() - timedelta(days=len(tickets_data) - i)
            
            ticket = SupportTicket(
                user_id=user.id,
                user_email=user.email,
                subject=ticket_data["subject"],
                category=ticket_data["category"],
                priority=ticket_data["priority"],
                status=ticket_data["status"],
                created_at=created_at,
                updated_at=created_at,
            )
            
            # Set resolved/closed timestamps
            if ticket_data["status"] == TicketStatus.RESOLVED:
                ticket.resolved_at = created_at + timedelta(hours=2)
                ticket.updated_at = ticket.resolved_at
            elif ticket_data["status"] == TicketStatus.CLOSED:
                ticket.resolved_at = created_at + timedelta(hours=2)
                ticket.closed_at = created_at + timedelta(hours=3)
                ticket.updated_at = ticket.closed_at
            
            session.add(ticket)
            session.commit()
            session.refresh(ticket)
            
            # Create initial user message
            user_reply = TicketReply(
                ticket_id=ticket.id,
                author_id=str(user.id),
                author_email=user.email,
                is_admin=False,
                message=ticket_data["message"],
                created_at=created_at + timedelta(minutes=1),
            )
            session.add(user_reply)
            
            # Create admin reply if exists
            if "admin_reply" in ticket_data:
                admin_reply = TicketReply(
                    ticket_id=ticket.id,
                    author_id="admin",
                    author_email="admin@computehub.com",
                    is_admin=True,
                    message=ticket_data["admin_reply"],
                    created_at=created_at + timedelta(hours=1),
                )
                session.add(admin_reply)
            
            # Create user follow-up if exists
            if "user_reply" in ticket_data:
                user_followup = TicketReply(
                    ticket_id=ticket.id,
                    author_id=str(user.id),
                    author_email=user.email,
                    is_admin=False,
                    message=ticket_data["user_reply"],
                    created_at=created_at + timedelta(hours=1, minutes=30),
                )
                session.add(user_followup)
            
            session.commit()
            created_count += 1
            print(f"✓ Created ticket #{ticket.id}: {ticket.subject}")
        
        print(f"\n✅ Successfully created {created_count} sample tickets!")

if __name__ == "__main__":
    create_sample_tickets()
