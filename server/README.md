# ASHBOURNE API Server

Express + MongoDB REST API for the ASHBOURNE clothing store.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   Fill in the required values:
   | Variable | Description |
   |---|---|
   | `MONGO_URI` | MongoDB connection string |
   | `JWT_ACCESS_SECRET` | Secret for signing access tokens |
   | `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |

3. **Seed the admin user** (optional)
   ```bash
   npm run seed:admin
   ```

4. **Start the dev server**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:5000`.

## Auth endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register a new customer |
| POST | `/api/auth/login` | — | Log in, receive access token + refresh cookie |
| POST | `/api/auth/refresh` | Cookie | Rotate refresh token, get new access token |
| POST | `/api/auth/logout` | Cookie | Revoke refresh token |
| GET | `/api/auth/me` | Bearer | Get current user profile |
| GET | `/api/health` | — | Health check |
