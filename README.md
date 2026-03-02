# Bestest Recipes

A recipe application with a Node.js web backend, React frontend, PostgreSQL database, Redis cache/queue, and a Go-based nutrition analyzer service.

## Architecture

```mermaid
flowchart LR
    User --> Web["Web (Node.js/React)"]
    Web -- CRUD --> PostgreSQL
    Web -- cache search results --> Cache["Cache (Redis)"]
    Web -- LPUSH job --> Queue["Queue (Redis)"]
    Queue --> Analyzer["nutrition-analyzer (Go)"]
    Analyzer --> PostgreSQL
```

- **Web**: Node.js + Express backend serving a React frontend. Handles recipe CRUD, caches search results in Redis, and enqueues nutrition analysis jobs to Redis.
- **nutrition-analyzer**: Go worker that polls a Redis list for jobs, analyzes recipe ingredients to estimate nutritional info (calories, protein, carbs, fat, fiber), and writes results to PostgreSQL.
- **Redis**: Used as a job queue (between web and analyzer) and a cache (for recipe search results).
- **PostgreSQL**: Primary data store for recipes and nutrition data.

## Features

- Recipe search and browsing
- Responsive design with Tailwind CSS
- Real-time search functionality
- Detailed recipe pages with ingredients and instructions
- Like/unlike recipes
- Nutritional analysis (async, powered by Go worker via Redis queue)
- Search result caching via Redis
- Docker/Podman support

## Tech stack

- **Web backend**: Node.js, Express, PostgreSQL, ioredis
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Nutrition analyzer**: Go, go-redis, pgx
- **Database**: PostgreSQL
- **Cache/Queue**: Redis
- **Container**: Docker/Podman

## Quick start

The easiest way to run the application is with Docker Compose or Podman Compose. This starts all services in one command.

### Prerequisites

- Docker or Podman with Compose

### Running

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd recipe-app-compose-demo
   ```

2. **Start all services**

   Using Docker Compose:

   ```bash
   docker compose -f apps/docker-compose.yml up --build -d
   ```

   Using Podman Compose:

   ```bash
   podman-compose -f apps/docker-compose.yml up --build -d
   ```

   This starts:

   - **PostgreSQL** database on port 5432
   - **Redis** on port 6379
   - **Web app** (backend + frontend) on http://localhost:3000
   - **Nutrition analyzer** (Go worker)

   The database is automatically seeded with sample recipes on first launch.

3. **View logs**

   ```bash
   docker compose -f apps/docker-compose.yml logs -f
   ```

   Or with Podman:

   ```bash
   podman-compose -f apps/docker-compose.yml logs -f
   ```

4. **Stop all services**

   ```bash
   docker compose -f apps/docker-compose.yml down
   ```

   To also remove the database volume (resets all data):

   ```bash
   docker compose -f apps/docker-compose.yml down -v
   ```

## Development

All application code lives under `apps/web/` (npm workspace with `backend` and `frontend` packages) and `apps/nutrition-analyzer/` (Go module).

1. **Start the database and Redis**

   ```bash
   docker compose -f apps/docker-compose.yml up db redis -d
   ```

2. **Install dependencies**

   ```bash
   cd apps/web
   npm install
   ```

3. **Start the development servers**

   ```bash
   DATABASE_URL=postgresql://recipe_user:recipe_pass@localhost:5432/recipe_db CACHE_REDIS_URL=redis://localhost:6379 QUEUE_REDIS_URL=redis://localhost:6380 npm run dev
   ```

   This starts:

   - Backend server on http://localhost:3001
   - Frontend dev server (Vite) on http://localhost:5173

   You can also run them individually with `npm run dev:backend` or `npm run dev:frontend`.

4. **Run the nutrition analyzer locally** (requires Go 1.23+)

   ```bash
   cd apps/nutrition-analyzer
   DATABASE_URL=postgresql://recipe_user:recipe_pass@localhost:5432/recipe_db QUEUE_REDIS_URL=redis://localhost:6380 go run .
   ```

### Database seeding

The database is automatically seeded with sample recipes on first launch. To re-seed manually:

```bash
cd apps/web/backend
npm run db:seed
```

## API endpoints

- `GET /health` - Health check
- `GET /api/recipes` - Get all recipes (supports `search`, `limit`, `offset` query parameters)
- `GET /api/recipes/:id` - Get recipe by ID
- `POST /api/recipes/:id/like` - Like a recipe
- `POST /api/recipes/:id/unlike` - Unlike a recipe
- `POST /api/recipes/:id/analyze` - Enqueue nutrition analysis (via queue -> Go worker)
- `GET /api/recipes/:id/nutrition` - Get nutrition data for a recipe

## Environment variables

These are configured automatically when using Docker/Podman Compose. Only set them manually for local development.

| Variable | Description | Default (Compose) |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (required) | `postgresql://recipe_user:recipe_pass@db:5432/recipe_db` |
| `CACHE_REDIS_URL` | Redis URL for caching (web only) | `redis://br-web-cache:6379` |
| `QUEUE_REDIS_URL` | Redis URL for job queue | `redis://br-queue:6379` |
| `SERVER_PORT` | Backend server port | `3000` |
| `FRONTEND_DEV_PORT` | Frontend dev server port | `5000` |
| `NODE_ENV` | Environment mode | `production` |

## License

MIT License
