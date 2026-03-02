export interface Recipe {
  id: number;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  cooking_time: number;
  difficulty: string;
  servings: number;
  image_url: string;
  created_at: string;
  liked_at: string | null;
}

export interface RecipeSummary {
  id: number;
  title: string;
  description: string;
  cooking_time: number;
  difficulty: string;
  image_url: string;
  created_at: string;
  liked_at: string | null;
}
