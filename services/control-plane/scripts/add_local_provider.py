from sqlmodel import Session, select
from app.core.db import engine, init_db
from app.core.models import Provider

init_db()

with Session(engine) as session:
    # Check if Local provider exists
    local_provider = session.exec(
        select(Provider).where(Provider.type == "local")
    ).first()
    
    if not local_provider:
        local_provider = Provider(
            name="Local (Test)",
            type="local",
            is_enabled=True,
            weight=0,  # Lowest priority
            api_key=None,
            config_json={}
        )
        session.add(local_provider)
        session.commit()
        print("✅ Local provider added successfully")
    else:
        # Update existing local provider to ensure correct name
        local_provider.name = "Local (Test)"
        local_provider.is_enabled = True
        local_provider.weight = 0
        session.add(local_provider)
        session.commit()
        print("✅ Local provider updated")
