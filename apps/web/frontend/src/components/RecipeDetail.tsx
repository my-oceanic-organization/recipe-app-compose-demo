import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Recipe } from "../types/recipe";

const RecipeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [likeInProgress, setLikeInProgress] = useState(false);

  const toggleLike = useCallback(async () => {
    if (!recipe) return;

    try {
      setLikeInProgress(true);

      const endpoint = recipe.liked_at
        ? `/api/recipes/${recipe.id}/unlike`
        : `/api/recipes/${recipe.id}/like`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${recipe.liked_at ? "unlike" : "like"} recipe`
        );
      }

      const updatedRecipe = await response.json();
      setRecipe(updatedRecipe);
    } catch (err) {
      console.error("Error toggling like status:", err);
    } finally {
      setLikeInProgress(false);
    }
  }, [recipe]);

  const fetchRecipe = useCallback(async (recipeId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/recipes/${recipeId}`);
      if (!response.ok) {
        throw new Error("Recipe not found");
      }

      const data = await response.json();
      setRecipe(data);
    } catch (err) {
      setError("Failed to load recipe");
      console.error("Error fetching recipe:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchRecipe(id);
    }
  }, [id, fetchRecipe]);

  const getDifficultyColor = useCallback((difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800 border border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="text-center py-8">
        <div className="bg-white rounded-xl p-8 max-w-md mx-auto border border-gray-200 shadow-sm">
          <p className="text-red-600 mb-4">{error || "Recipe not found"}</p>
          <Link
            to="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 font-semibold inline-block"
          >
            Back to Recipes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm transition-all duration-300"
      >
        ← Back to Recipes
      </Link>

      <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <div className="relative">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-64 md:h-96 object-cover"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800";
            }}
          />
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">{recipe.title}</h1>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleLike}
                disabled={likeInProgress}
                className="flex items-center justify-center w-10 h-10 ml-4 rounded-full hover:bg-gray-100 transition-colors duration-200"
                aria-label={recipe.liked_at ? "Unlike recipe" : "Like recipe"}
              >
                {likeInProgress ? (
                  <span className="animate-pulse">❤️</span>
                ) : (
                  <span
                    className={
                      recipe.liked_at ? "text-red-500" : "text-gray-400"
                    }
                  >
                    {recipe.liked_at ? "❤️" : "🤍"}
                  </span>
                )}
              </button>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${getDifficultyColor(
                  recipe.difficulty
                )}`}
              >
                {recipe.difficulty}
              </span>
            </div>
          </div>

          <p className="text-gray-600 text-lg mb-6">{recipe.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">⏱️</div>
              <div className="text-sm text-gray-600">Cooking Time</div>
              <div className="text-lg font-semibold text-gray-900">
                {recipe.cooking_time} minutes
              </div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-3xl font-bold text-green-600 mb-2">👥</div>
              <div className="text-sm text-gray-600">Servings</div>
              <div className="text-lg font-semibold text-gray-900">
                {recipe.servings} people
              </div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-3xl font-bold text-purple-600 mb-2">📅</div>
              <div className="text-sm text-gray-600">Added</div>
              <div className="text-lg font-semibold text-gray-900">
                {new Date(recipe.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ingredients
              </h2>
              <ul className="space-y-3">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-3 text-lg">•</span>
                    <span className="text-gray-700">{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Instructions
              </h2>
              <ol className="space-y-4">
                {recipe.instructions.map((instruction, index) => (
                  <li key={index} className="flex">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
