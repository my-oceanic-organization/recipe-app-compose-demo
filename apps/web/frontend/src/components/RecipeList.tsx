import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { RecipeSummary } from "../types/recipe";

// Custom hook for debouncing
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const RecipeList = () => {
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [likeInProgress, setLikeInProgress] = useState<Record<number, boolean>>(
    {}
  );

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const toggleLike = useCallback(
    async (recipe: RecipeSummary, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        setLikeInProgress((prev) => ({ ...prev, [recipe.id]: true }));

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

        // Update the recipes array with the updated recipe
        setRecipes((prevRecipes) =>
          prevRecipes.map((r) =>
            r.id === updatedRecipe.id ? updatedRecipe : r
          )
        );
      } catch (err) {
        console.error("Error toggling like status:", err);
      } finally {
        setLikeInProgress((prev) => ({ ...prev, [recipe.id]: false }));
      }
    },
    []
  );

  const fetchRecipes = useCallback(
    async (search: string, isSearch: boolean = false) => {
      try {
        if (isSearch) {
          setSearching(true);
        } else {
          setLoading(true);
        }

        const params = new URLSearchParams();
        if (search) {
          params.append("search", search);
        }

        const response = await fetch(`/api/recipes?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch recipes");
        }

        const data = await response.json();
        setRecipes(data);
      } catch (err) {
        setError("Failed to load recipes");
        console.error("Error fetching recipes:", err);
      } finally {
        if (isSearch) {
          setSearching(false);
        } else {
          setLoading(false);
        }
      }
    },
    []
  );

  // Initial load - only run once on mount
  useEffect(() => {
    fetchRecipes("", false);
  }, []); // Remove fetchRecipes from dependencies to avoid re-runs

  // Fetch recipes when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm !== "") {
      fetchRecipes(debouncedSearchTerm, true);
    } else if (debouncedSearchTerm === "") {
      // When search is cleared or empty, fetch all recipes
      fetchRecipes("", true);
    }
  }, [debouncedSearchTerm, fetchRecipes]);

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

  // Memoize the recipe cards to prevent unnecessary re-renders
  const recipeCards = useMemo(() => {
    return recipes.map((recipe) => (
      <div
        key={recipe.id}
        className="bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group border border-gray-200/50"
      >
        <div className="relative overflow-hidden">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400";
            }}
          />
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900">{recipe.title}</h2>
            <button
              onClick={(e) => toggleLike(recipe, e)}
              disabled={likeInProgress[recipe.id]}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors duration-200"
              aria-label={recipe.liked_at ? "Unlike recipe" : "Like recipe"}
            >
              {likeInProgress[recipe.id] ? (
                <span className="animate-pulse">❤️</span>
              ) : (
                <span
                  className={recipe.liked_at ? "text-red-500" : "text-gray-400"}
                >
                  {recipe.liked_at ? "❤️" : "🤍"}
                </span>
              )}
            </button>
          </div>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {recipe.description}
          </p>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500 flex items-center">
              <span className="mr-1">⏱️</span> {recipe.cooking_time} min
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${getDifficultyColor(
                recipe.difficulty
              )}`}
            >
              {recipe.difficulty}
            </span>
          </div>

          <Link
            to={`/recipe/${recipe.id}`}
            className="block w-full text-center bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-all duration-300 font-semibold"
          >
            View Recipe
          </Link>
        </div>
      </div>
    ));
  }, [recipes, getDifficultyColor]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-center">Loading recipes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-white rounded-xl p-8 max-w-md mx-auto border border-gray-200 shadow-sm">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchRecipes(debouncedSearchTerm, false)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6 text-center">
          Discover Amazing Recipes
        </h1>
        <div className="max-w-md mx-auto relative">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 text-gray-900 placeholder-gray-500 text-lg shadow-sm"
          />
          {searching && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-white rounded-xl p-8 max-w-md mx-auto border border-gray-200 shadow-sm">
            <p className="text-gray-600 text-lg">No recipes found.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipeCards}
        </div>
      )}
    </div>
  );
};

export default RecipeList;
