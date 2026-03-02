const { Router } = require("express");

const recipeRoutes = (pool) => {
  const router = Router();

  // Get all recipes with search
  router.get("/", async (req, res) => {
    try {
      const { search, limit = 20, offset = 0 } = req.query;

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

      // Check if recipe exists
      const checkResult = await pool.query(
        "SELECT id FROM recipes WHERE id = $1",
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      // Set liked_at to current timestamp
      const query =
        "UPDATE recipes SET liked_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *";
      const result = await pool.query(query, [id]);

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error liking recipe:", error);
      res.status(500).json({ error: "Failed to like recipe" });
    }
  });

  // Unlike a recipe
  router.post("/:id/unlike", async (req, res) => {
    try {
      const { id } = req.params;

      // Check if recipe exists
      const checkResult = await pool.query(
        "SELECT id FROM recipes WHERE id = $1",
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: "Recipe not found" });
      }

      // Set liked_at to NULL
      const query =
        "UPDATE recipes SET liked_at = NULL WHERE id = $1 RETURNING *";
      const result = await pool.query(query, [id]);

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error unliking recipe:", error);
      res.status(500).json({ error: "Failed to unlike recipe" });
    }
  });

  return router;
};

module.exports = { recipeRoutes };
