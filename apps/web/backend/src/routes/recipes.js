const { Router } = require("express");

const CACHE_TTL = 60;

const recipeRoutes = (pool, redis) => {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const { search, limit = 20, offset = 0 } = req.query;

      const cacheKey = `recipes:search:${search || ""}:${limit}:${offset}`;
      if (redis) {
        try {
          const cached = await redis.get(cacheKey);
          if (cached) {
            return res.json(JSON.parse(cached));
          }
        } catch (err) {
          console.warn("Redis cache read failed:", err.message);
        }
      }

      let query = `
        SELECT id, title, description, cooking_time, difficulty, image_url, created_at, liked_at
        FROM recipes
      `;
      const params = [];

      if (search) {
        query += ` WHERE title ILIKE $1 OR description ILIKE $1`;
        params.push(`%${search}%`);
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${
        params.length + 2
      }`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      if (redis) {
        try {
          await redis.set(cacheKey, JSON.stringify(result.rows), "EX", CACHE_TTL);
        } catch (err) {
          console.warn("Redis cache write failed:", err.message);
        }
      }

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      res.status(500).json({ error: "Failed to fetch recipes" });
    }
  });

  // Get single recipe by ID
  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query("SELECT * FROM recipes WHERE id = $1", [
        id,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching recipe:", error);
      res.status(500).json({ error: "Failed to fetch recipe" });
    }
  });

  // Like a recipe
  router.post("/:id/like", async (req, res) => {
    try {
      const { id } = req.params;

      const checkResult = await pool.query(
        "SELECT id FROM recipes WHERE id = $1",
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      const query =
        "UPDATE recipes SET liked_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *";
      const result = await pool.query(query, [id]);

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error liking recipe:", error);
      res.status(500).json({ error: "Failed to like recipe" });
    }
  });

  router.post("/:id/unlike", async (req, res) => {
    try {
      const { id } = req.params;

      const checkResult = await pool.query(
        "SELECT id FROM recipes WHERE id = $1",
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      const query =
        "UPDATE recipes SET liked_at = NULL WHERE id = $1 RETURNING *";
      const result = await pool.query(query, [id]);

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error unliking recipe:", error);
      res.status(500).json({ error: "Failed to unlike recipe" });
    }
  });

  router.get("/:id/nutrition", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "SELECT recipe_id, calories, protein_g, carbs_g, fat_g, fiber_g, analyzed_at FROM recipe_nutrition WHERE recipe_id = $1",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Nutrition data not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching nutrition:", error);
      res.status(500).json({ error: "Failed to fetch nutrition data" });
    }
  });

  router.post("/:id/analyze", async (req, res) => {
    try {
      const { id } = req.params;

      const check = await pool.query("SELECT id FROM recipes WHERE id = $1", [id]);
      if (check.rows.length === 0) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      if (!redis) {
        return res.status(503).json({ error: "Job queue unavailable" });
      }

      const job = JSON.stringify({ recipe_id: parseInt(id), attempt: 1 });
      await redis.lpush("jobs:nutrition", job);

      res.json({ status: "queued", recipe_id: parseInt(id) });
    } catch (error) {
      console.error("Error enqueuing analysis:", error);
      res.status(500).json({ error: "Failed to enqueue analysis" });
    }
  });

  return router;
};

module.exports = { recipeRoutes };
