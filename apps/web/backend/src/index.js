const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const Redis = require("ioredis");
const { recipeRoutes } = require("./routes/recipes");
const path = require("path");

const app = express();
const port = process.env.SERVER_PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : undefined,
});

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 3 })
  : null;

if (redis) {
  redis.connect().then(() => {
    console.log("Connected to Redis");
  }).catch((err) => {
    console.warn("Redis connection failed, caching disabled:", err.message);
  });
}

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/recipes", recipeRoutes(pool, redis));

app.use(express.static(path.join(__dirname, "../../frontend/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

process.on('SIGINT', function() {
  console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
  if (redis) redis.disconnect();
  process.exit(0);
});

module.exports = { pool };
