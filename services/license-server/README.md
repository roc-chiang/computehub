# License Verification Server

Simple FastAPI service for verifying ComputeHub Pro License keys.

## Features

- License key verification
- License revocation
- Verification logging
- SQLite database

## API Endpoints

- `POST /api/verify` - Verify a license key
- `POST /api/revoke` - Revoke a license key (admin only)

## Environment Variables

- `DATABASE_URL` - SQLite database path (default: `sqlite:///./data/licenses.db`)
- `API_SECRET_KEY` - Secret key for admin operations

## Running

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Docker

```bash
docker build -t license-server .
docker run -p 8001:8000 license-server
```
