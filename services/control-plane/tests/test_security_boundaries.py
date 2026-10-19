import asyncio
from datetime import datetime, timedelta

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlmodel import Session, SQLModel, create_engine

from app.api.v1.deployments import get_owned_deployment
from app.core import auth
from app.core import team_models  # noqa: F401 - registers organization tables
from app.core.models import (
    Deployment,
    ProviderType,
    SupportTicket,
    SystemSetting,
    TicketCategory,
    TicketPriority,
    TicketReply,
    TicketStatus,
    User,
)
from app.core.automation_models import CostTracking, PriceHistory
from app.services.ssh_service import SSHService
from app.services.license_checker import LicenseChecker
from app.utils.cost_calculator import get_user_cost_summary
from app.api.v1.tickets import get_my_ticket, list_my_tickets
from app.scheduler.cost_monitor import CostMonitor
from app.core.provider_manager import ProviderManager
from app.scheduler.rule_engine import RuleEngine
from app.services.webhook_service import WebhookService
from app.core.decorators import require_pro_license


@pytest.fixture()
def session():
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as db:
        yield db


def test_deployment_lookup_rejects_another_user(session):
    owner = User(email="owner@example.com", clerk_id="owner")
    attacker = User(email="attacker@example.com", clerk_id="attacker")
    session.add(owner)
    session.add(attacker)
    session.commit()
    session.refresh(owner)
    session.refresh(attacker)
    deployment = Deployment(
        user_id=owner.id,
        name="private",
        provider=ProviderType.LOCAL,
        gpu_type="local",
        image="local:test",
    )
    session.add(deployment)
    session.commit()
    session.refresh(deployment)

    with pytest.raises(HTTPException) as exc:
        get_owned_deployment(deployment.id, attacker, session)
    assert exc.value.status_code == 404


def test_admin_dependency_rejects_non_admin(monkeypatch, session):
    monkeypatch.setattr(auth, "verify_token", lambda token, db: {"sub": "user-1", "email": "u@example.com"})
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="token")

    with pytest.raises(HTTPException) as exc:
        auth.require_admin(credentials, session)
    assert exc.value.status_code == 403


def test_admin_dependency_accepts_clerk_admin_metadata(monkeypatch, session):
    payload = {
        "sub": "admin-1",
        "email": "admin@example.com",
        "public_metadata": {"role": "admin"},
    }
    monkeypatch.setattr(auth, "verify_token", lambda token, db: payload)
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="token")

    user = auth.require_admin(credentials, session)
    assert user.clerk_id == "admin-1"


def test_disabled_user_is_rejected(monkeypatch, session):
    user = User(email="disabled@example.com", clerk_id="disabled", is_active=False)
    session.add(user)
    session.commit()
    monkeypatch.setattr(auth, "verify_token", lambda token, db: {"sub": "disabled"})
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="token")

    with pytest.raises(HTTPException) as exc:
        auth.get_current_user(credentials, session)
    assert exc.value.status_code == 403


def test_new_user_requires_real_email_claim(monkeypatch, session):
    monkeypatch.setattr(auth, "verify_token", lambda token, db: {"sub": "no-email"})
    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials="token")

    with pytest.raises(HTTPException) as exc:
        auth.get_current_user(credentials, session)
    assert exc.value.status_code == 400


@pytest.mark.parametrize("path", ["/workspace/../etc/passwd", "/etc/passwd", "../../secret"])
def test_ssh_file_access_stays_inside_workspace(path):
    with pytest.raises(ValueError):
        SSHService._workspace_path(path)


def test_ssh_requires_known_hosts_in_production(monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.delenv("SSH_KNOWN_HOSTS", raising=False)
    with pytest.raises(RuntimeError):
        SSHService._connection_options()


def test_cost_summary_uses_recorded_costs_only(session):
    user = User(email="cost@example.com", clerk_id="cost-user")
    session.add(user)
    session.commit()
    session.refresh(user)
    deployment = Deployment(
        user_id=user.id,
        name="tracked",
        provider=ProviderType.LOCAL,
        gpu_type="test-gpu",
        image="local:test",
    )
    session.add(deployment)
    session.commit()
    session.refresh(deployment)

    now = datetime.utcnow()
    session.add(CostTracking(
        deployment_id=deployment.id,
        user_id=user.id,
        cost_usd=2.5,
        gpu_hours=1.0,
        period_start=now - timedelta(hours=1),
        period_end=now,
        provider="local",
        gpu_type="test-gpu",
        price_per_hour=2.5,
    ))
    session.commit()

    summary = asyncio.run(get_user_cost_summary(user.id, session))
    assert summary["total_all_time"] == 2.5
    assert summary["total_today"] == 2.5


def test_license_encryption_fails_closed_without_key(monkeypatch, session):
    monkeypatch.delenv("ENCRYPTION_KEY", raising=False)
    monkeypatch.setattr("app.core.encryption._encryption_instance", None)

    checker = LicenseChecker(session)
    with pytest.raises(ValueError, match="ENCRYPTION_KEY"):
        checker._encrypt_license_key("COMPUTEHUB-AAAA-BBBB-CCCC-DDDD")


def test_ticket_admin_reply_is_unread_until_user_opens_ticket(session):
    user = User(email="ticket@example.com", clerk_id="ticket-user")
    session.add(user)
    session.commit()
    session.refresh(user)
    ticket = SupportTicket(
        user_id=user.id,
        user_email=user.email,
        subject="Help",
        category=TicketCategory.TECHNICAL,
        priority=TicketPriority.MEDIUM,
        status=TicketStatus.OPEN,
        user_last_read_at=datetime.utcnow() - timedelta(minutes=5),
    )
    session.add(ticket)
    session.commit()
    session.refresh(ticket)
    session.add(TicketReply(
        ticket_id=ticket.id,
        author_id="admin",
        author_email="admin@example.com",
        is_admin=True,
        message="Reply",
    ))
    session.commit()

    tickets = asyncio.run(list_my_tickets(status=None, skip=0, limit=50, session=session, user=user))
    assert tickets[0].has_unread is True

    asyncio.run(get_my_ticket(ticket.id, session=session, user=user))
    tickets = asyncio.run(list_my_tickets(status=None, skip=0, limit=50, session=session, user=user))
    assert tickets[0].has_unread is False


def test_cost_tracking_uses_elapsed_time_and_real_price(monkeypatch, session):
    class Adapter:
        async def get_pricing(self, gpu_type):
            return 2.0

    user = User(email="usage@example.com", clerk_id="usage-user")
    session.add(user)
    session.commit()
    session.refresh(user)
    deployment = Deployment(
        user_id=user.id,
        name="usage",
        provider=ProviderType.LOCAL,
        status="running",
        gpu_type="test-gpu",
        gpu_count=2,
        image="local:test",
        created_at=datetime.utcnow() - timedelta(minutes=30),
    )
    session.add(deployment)
    session.commit()
    session.refresh(deployment)
    monkeypatch.setattr(ProviderManager, "get_deployment_adapter", lambda deployment, db: Adapter())

    record = asyncio.run(CostMonitor().track_deployment_cost(deployment, session))

    assert record is not None
    assert record.gpu_hours == pytest.approx(1.0, rel=0.02)
    assert record.cost_usd == pytest.approx(2.0, rel=0.02)


def test_price_change_trigger_uses_recorded_prices(session):
    user = User(email="price@example.com", clerk_id="price-user")
    session.add(user)
    session.commit()
    session.refresh(user)
    deployment = Deployment(
        user_id=user.id,
        name="price",
        provider=ProviderType.LOCAL,
        status="running",
        gpu_type="test-gpu",
        image="local:test",
    )
    session.add(deployment)
    session.commit()
    session.refresh(deployment)
    session.add(PriceHistory(
        deployment_id=deployment.id,
        provider="local",
        gpu_type="test-gpu",
        price_per_hour=1.0,
        recorded_at=datetime.utcnow() - timedelta(minutes=5),
    ))
    session.add(PriceHistory(
        deployment_id=deployment.id,
        provider="local",
        gpu_type="test-gpu",
        price_per_hour=1.2,
        recorded_at=datetime.utcnow(),
    ))
    session.commit()

    triggered, context = asyncio.run(RuleEngine()._evaluate_price_change(
        {"change_percentage": 10, "direction": "increase"},
        [deployment],
        session,
        {},
    ))

    assert triggered is True
    assert context["price_change_percentage"] == pytest.approx(20.0)


def test_webhook_rejects_private_destination(monkeypatch, session):
    monkeypatch.setattr(
        "app.services.webhook_service.socket.getaddrinfo",
        lambda *args, **kwargs: [(2, 1, 6, "", ("169.254.169.254", 80))],
    )

    with pytest.raises(ValueError, match="public IP"):
        asyncio.run(WebhookService(session)._validate_public_url("http://metadata.test/latest"))


def test_webhook_accepts_public_destination(monkeypatch, session):
    monkeypatch.setattr(
        "app.services.webhook_service.socket.getaddrinfo",
        lambda *args, **kwargs: [(2, 1, 6, "", ("93.184.216.34", 443))],
    )

    asyncio.run(WebhookService(session)._validate_public_url("https://example.com/hook"))


def test_pro_decorator_reuses_endpoint_session_without_injecting_db(monkeypatch, session):
    monkeypatch.setattr(LicenseChecker, "is_pro_enabled", lambda self: True)

    @require_pro_license
    async def endpoint(value: str, session: Session):
        return value, session

    value, received_session = asyncio.run(endpoint(value="ok", session=session))
    assert value == "ok"
    assert received_session is session


def test_corrupt_license_record_does_not_enable_pro(session):
    session.add(SystemSetting(
        key=LicenseChecker.LICENSE_KEY_SETTING,
        value="not-encrypted",
        is_secret=True,
    ))
    session.commit()

    assert LicenseChecker(session).is_pro_enabled() is False
