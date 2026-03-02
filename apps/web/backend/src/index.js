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

const cacheRedis = process.env.CACHE_REDIS_URL
  ? new Redis(process.env.CACHE_REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 3 })
  : null;

const queueRedis = process.env.QUEUE_REDIS_URL
  ? new Redis(process.env.QUEUE_REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 3 })
  : null;

if (cacheRedis) {
  cacheRedis.connect().then(() => {
    console.log("Connected to cache Redis");
  }).catch((err) => {
    console.warn("Cache Redis connection failed, caching disabled:", err.message);
  });
}

if (queueRedis) {
  queueRedis.connect().then(() => {
    console.log("Connected to queue Redis");
  }).catch((err) => {
    console.warn("Queue Redis connection failed, job queue disabled:", err.message);
  });
}

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/recipes", recipeRoutes(pool, cacheRedis, queueRedis));

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
  if (cacheRedis) cacheRedis.disconnect();
  if (queueRedis) queueRedis.disconnect();
  process.exit(0);
});

module.exports = { pool };
