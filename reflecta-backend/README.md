# Reflecta Backend API

This is the backend API server for the Reflecta application, built with Express.js and MongoDB.

## Features

- User authentication (register/login) with JWT
- Goals management (Mandalart structure)
- Journal entries storage
- Chat sessions persistence
- RESTful API endpoints

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp env.example .env
```

Edit `.env` file with your configuration:

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default: 5000)
- `CORS_ORIGIN`: Frontend URL (default: http://localhost:3000)

3. Start the server:

```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Goals

- `GET /api/goals` - Get user's goals
- `POST /api/goals` - Save/update user's goals

### Journal

- `GET /api/journal` - Get user's journal entries
- `POST /api/journal` - Create new journal entry

### Chat

- `GET /api/chat` - Get user's chat session
- `POST /api/chat` - Save chat session

### Health

- `GET /api/health` - Health check endpoint

## Database Schema

### Users

- email, password, name, timestamps

### Goals

- userId, mandalartData (nested structure), timestamps

### Journal Entries

- userId, title, content, mood, tags, date, isAIGenerated, timestamps

### Chat Sessions

- userId, messages (array), timestamps

## Authentication

All protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```
