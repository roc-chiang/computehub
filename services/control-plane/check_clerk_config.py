from sqlmodel import Session, create_engine, select
from app.core.models import SystemSetting

engine = create_engine('sqlite:///./test.db')
session = Session(engine)

clerk_setting = session.get(SystemSetting, 'CLERK_ISSUER_URL')
print(f'CLERK_ISSUER_URL exists: {clerk_setting is not None}')
if clerk_setting:
    print(f'Value: {clerk_setting.value}')
else:
    print('Value: NOT SET')
    print('\nThis is likely causing the 403 Forbidden error!')
    print('You need to set CLERK_ISSUER_URL in the database.')

session.close()
