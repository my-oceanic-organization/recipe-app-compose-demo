# Recipe App

A simple recipe application with a Node.js backend, React frontend, and PostgreSQL database.

## Features

- 🍳 Recipe search and browsing
- 📱 Responsive design with Tailwind CSS
- 🔍 Real-time search functionality
- 📖 Detailed recipe pages with ingredients and instructions
- 🐳 Docker/Podman support
- ⚡ Fast builds with minimal dependencies

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, PostgreSQL
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Database**: PostgreSQL
- **Container**: Docker/Podman

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Docker or Podman (optional)

### Development Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd recipe-ai-app
   ```

2. **Install dependencies**

   ```bash
   npm ci
   ```

3. **Start the development servers**

   ```bash
   DATABASE_URL=<some Postgres URL here, don't require SSL in dev> npm run dev
   ```

   This will start:

   - Frontend development server on http://localhost:3000
   - Backend server on http://localhost:3001

### Docker Setup

1. **Build the Docker image**

   ```bash
   podman build -t recipe-ai-app .
   ```

2. **Run the container**
   ```bash
   podman run -d \
     --name recipe-app \
     -p 3001:3001 \
     -e DATABASE_URL="postgresql://username:password@host:5432/recipe_db" \
     recipe-ai-app
   ```

## API Endpoints

- `GET /health` - Health check
- `GET /api/recipes` - Get all recipes (supports search query parameter)
- `GET /api/recipes/:id` - Get recipe by ID

## Database Schema

The application uses a single `recipes` table with the following structure:

```sql
CREATE TABLE recipes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  ingredients TEXT[] NOT NULL,
  instructions TEXT[] NOT NULL,
  cooking_time INTEGER NOT NULL,
  difficulty VARCHAR(50) NOT NULL,
  servings INTEGER DEFAULT 4,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Development

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:backend` - Start only the backend server
- `npm run dev:frontend` - Start only the frontend development server
- `npm run build` - Build both frontend and backend for production
- `npm start` - Start the production backend server

### Database Seeding

The application includes sample recipe data that is automatically seeded when the application starts. You can manually run the seeding script:

```bash
cd backend
npm run db:seed
```

## Project Structure

```
recipe-ai-app/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── index.ts        # Main server file
│   │   ├── routes/         # API routes
│   │   └── db/             # Database utilities
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── types/          # TypeScript types
│   │   ├── App.tsx         # Main app component
│   │   └── main.tsx        # Entry point
│   ├── package.json
│   └── vite.config.ts
├── Dockerfile              # Multi-stage Docker build
├── docker-entrypoint.sh    # Docker startup script
└── package.json            # Root package.json (workspaces)
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (required)
- `FRONTEND_DEV_PORT` - Frontend port (default: 5000)
- `SERVER_PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License
