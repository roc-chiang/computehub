"""Test script to debug migration issues"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

try:
    print("Step 1: Importing SQLModel...")
    from sqlmodel import SQLModel
    from app.core.db import engine
    print("✓ SQLModel imported")
    
    print("\nStep 2: Importing existing models...")
    from app.core.models import User, Deployment
    print("✓ Existing models imported")
    
    print("\nStep 3: Importing automation models...")
    from app.core.automation_models import AutomationRule, PriceHistory
    print("✓ Automation models imported")
    
    print("\nStep 4: Checking metadata...")
    print(f"Tables in metadata: {list(SQLModel.metadata.tables.keys())}")
    
    print("\nStep 5: Creating tables with checkfirst=True...")
    SQLModel.metadata.create_all(engine, checkfirst=True)
    print("✓ Tables created successfully!")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
