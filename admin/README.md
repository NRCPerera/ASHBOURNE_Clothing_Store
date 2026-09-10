# ASHBOURNE — Admin Portal

React + Vite admin portal for managing products, orders, and inventory.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   | Variable | Description |
   |---|---|
   | `VITE_API_URL` | API base URL (default: `http://localhost:5000/api`) |

3. **Start the dev server**
   ```bash
   npm run dev
   ```
   Opens at `http://localhost:5174`. API requests to `/api/*` are proxied to the Express server.

## Build for production

```bash
npm run build    # output in dist/
npm run preview  # preview production build
```
