# StockWise

Real-Time Stock Market Investment Support System

## Architecture

**Client:**
React.js

**Server:**
Node.js + Express.js

**Database:**
MongoDB (via Mongoose)

```
React Client
      |
      | HTTP / REST API
      | JSON
      v
Node.js + Express Server
      |
      | Mongoose
      v
MongoDB
```

The React client never communicates directly with MongoDB. All database access happens exclusively through the Express server.

## Project Structure

```
StockWise/
    client/          # React frontend (Vite)
    server/          # Node.js + Express backend
```

## Development Instructions

### Terminal 1 — Start the Backend

```bash
cd server
npm install
npm run dev
```

The Express server will run on `http://localhost:5000`.

### Terminal 2 — Start the Frontend

```bash
cd client
npm install
npm run dev
```

The React development server will run on `http://localhost:5173`.

## Database Setup

StockWise uses **MongoDB** as its database, accessed through **Mongoose** (an ODM for Node.js).

The architecture is:

```
React
  ↓
Express REST API
  ↓
Mongoose
  ↓
MongoDB
```

The React client never communicates directly with MongoDB.

### Configure the Connection String

1. Open `server/.env`.
2. Set the `MONGO_URI` variable to your MongoDB connection string:

```
MONGO_URI=<MongoDB connection string>
```

For example, a MongoDB Atlas connection string looks like:

```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>
```

Do **not** commit real database credentials. The `.env` file is ignored by Git.

## Verify Client-Server Communication

Visit:

```
http://localhost:5173/test
```

This page should successfully communicate with:

```
http://localhost:5000/api/health
```

and display:

```
✓ StockWise API is running
```

along with the returned JSON response.

## API Endpoints

| Method | Endpoint       | Description                    |
| ------ | -------------- | ------------------------------ |
| GET    | /api/health    | Health check for the API and database |

## Environment Variables

### Server (`server/.env`)

```
PORT=5000
NODE_ENV=development
MONGO_URI=<MongoDB connection string>
```

### Client (`client/.env`)

```
VITE_API_BASE_URL=http://localhost:5000/api
```

Copy the `.env.example` files to `.env` if they do not already exist.