package main

import (
	"context"
	"fmt"
	"log"
	"math"
	"math/rand"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type NutritionJob struct {
	RecipeID int `json:"recipe_id"`
	Attempt  int `json:"attempt"`
}

type NutritionResult struct {
	RecipeID   int     `json:"recipe_id"`
	Calories   int     `json:"calories"`
	ProteinG   float64 `json:"protein_g"`
	CarbsG     float64 `json:"carbs_g"`
	FatG       float64 `json:"fat_g"`
	FiberG     float64 `json:"fiber_g"`
	AnalyzedAt string  `json:"analyzed_at"`
}

type nutrientInfo struct {
	calsPer100g    float64
	proteinPer100g float64
	carbsPer100g   float64
	fatPer100g     float64
	fiberPer100g   float64
}

var nutritionDB = map[string]nutrientInfo{
	"pasta":        {160, 5.5, 31, 0.9, 1.8},
	"spaghetti":    {160, 5.5, 31, 0.9, 1.8},
	"noodle":       {138, 4.5, 25, 2.1, 1.2},
	"rice":         {130, 2.7, 28, 0.3, 0.4},
	"chicken":      {165, 31, 0, 3.6, 0},
	"beef":         {250, 26, 0, 15, 0},
	"lamb":         {294, 25, 0, 21, 0},
	"pork":         {242, 27, 0, 14, 0},
	"salmon":       {208, 20, 0, 13, 0},
	"shrimp":       {99, 24, 0.2, 0.3, 0},
	"tuna":         {132, 28, 0, 1.3, 0},
	"egg":          {155, 13, 1.1, 11, 0},
	"butter":       {717, 0.9, 0.1, 81, 0},
	"olive oil":    {884, 0, 0, 100, 0},
	"oil":          {884, 0, 0, 100, 0},
	"onion":        {40, 1.1, 9.3, 0.1, 1.7},
	"garlic":       {149, 6.4, 33, 0.5, 2.1},
	"tomato":       {18, 0.9, 3.9, 0.2, 1.2},
	"cheese":       {402, 25, 1.3, 33, 0},
	"parmesan":     {431, 38, 4.1, 29, 0},
	"mozzarella":   {280, 28, 3.1, 17, 0},
	"cream":        {340, 2.1, 2.8, 36, 0},
	"flour":        {364, 10, 76, 1, 2.7},
	"sugar":        {387, 0, 100, 0, 0},
	"honey":        {304, 0.3, 82, 0, 0.2},
	"potato":       {77, 2, 17, 0.1, 2.2},
	"carrot":       {41, 0.9, 10, 0.2, 2.8},
	"mushroom":     {22, 3.1, 3.3, 0.3, 1},
	"pepper":       {20, 0.9, 4.6, 0.2, 1.7},
	"lemon":        {29, 1.1, 9.3, 0.3, 2.8},
	"lime":         {30, 0.7, 10.5, 0.2, 2.8},
	"milk":         {61, 3.2, 4.8, 3.3, 0},
	"bread":        {265, 9, 49, 3.2, 2.7},
	"bacon":        {541, 37, 1.4, 42, 0},
	"pancetta":     {541, 37, 1.4, 42, 0},
	"tofu":         {76, 8, 1.9, 4.8, 0.3},
	"coconut milk": {230, 2.3, 6, 24, 0},
	"spinach":      {23, 2.9, 3.6, 0.4, 2.2},
	"broccoli":     {34, 2.8, 7, 0.4, 2.6},
	"avocado":      {160, 2, 8.5, 14.7, 6.7},
	"bean":         {347, 21, 63, 1.2, 15.2},
	"lentil":       {116, 9, 20, 0.4, 7.9},
	"chickpea":     {164, 8.9, 27, 2.6, 7.6},
	"almond":       {579, 21, 22, 49, 12.5},
	"walnut":       {654, 15, 14, 65, 6.7},
	"ginger":       {80, 1.8, 18, 0.8, 2},
	"soy sauce":    {53, 8.1, 4.9, 0.6, 0.8},
	"wine":         {83, 0.1, 2.6, 0, 0},
	"tortilla":     {237, 6.1, 38, 7.4, 2.5},
}

var amountRegex = regexp.MustCompile(`(\d+)\s*(g|kg|ml|l|oz)\b`)

func processNutritionJob(ctx context.Context, db *pgxpool.Pool, job *NutritionJob) error {
	var ingredients []string
	var servings int
	err := db.QueryRow(ctx,
		"SELECT ingredients, servings FROM recipes WHERE id = $1",
		job.RecipeID,
	).Scan(&ingredients, &servings)
	if err != nil {
		return fmt.Errorf("recipe %d not found: %w", job.RecipeID, err)
	}

	if servings <= 0 {
		servings = 4
	}

	time.Sleep(2 * time.Second)

	result := analyzeIngredients(job.RecipeID, ingredients, servings)

	_, err = db.Exec(ctx, `
		INSERT INTO recipe_nutrition (recipe_id, calories, protein_g, carbs_g, fat_g, fiber_g, analyzed_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		ON CONFLICT (recipe_id)
		DO UPDATE SET calories = $2, protein_g = $3, carbs_g = $4, fat_g = $5, fiber_g = $6, analyzed_at = NOW()
	`, result.RecipeID, result.Calories, result.ProteinG, result.CarbsG, result.FatG, result.FiberG)
	if err != nil {
		return fmt.Errorf("failed to save nutrition data: %w", err)
	}

	log.Printf("Recipe %d: %d kcal, %.1fg protein, %.1fg carbs, %.1fg fat per serving",
		result.RecipeID, result.Calories, result.ProteinG, result.CarbsG, result.FatG)
	return nil
}

func analyzeIngredients(recipeID int, ingredients []string, servings int) NutritionResult {
	var totalCals, totalProtein, totalCarbs, totalFat, totalFiber float64

	for _, ing := range ingredients {
		lower := strings.ToLower(ing)
		amount := 100.0

		if matches := amountRegex.FindStringSubmatch(lower); len(matches) > 0 {
			if v, err := strconv.ParseFloat(matches[1], 64); err == nil {
				amount = v
				switch matches[2] {
				case "kg", "l":
					amount *= 1000
				case "oz":
					amount *= 28.35
				}
			}
		}

		for keyword, info := range nutritionDB {
			if strings.Contains(lower, keyword) {
				factor := amount / 100.0
				totalCals += info.calsPer100g * factor
				totalProtein += info.proteinPer100g * factor
				totalCarbs += info.carbsPer100g * factor
				totalFat += info.fatPer100g * factor
				totalFiber += info.fiberPer100g * factor
				break
			}
		}
	}

	jitter := 0.95 + rand.Float64()*0.1
	s := float64(servings)

	return NutritionResult{
		RecipeID: recipeID,
		Calories: int(math.Round(totalCals * jitter / s)),
		ProteinG: math.Round(totalProtein*jitter/s*10) / 10,
		CarbsG:   math.Round(totalCarbs*jitter/s*10) / 10,
		FatG:     math.Round(totalFat*jitter/s*10) / 10,
		FiberG:   math.Round(totalFiber*jitter/s*10) / 10,
	}
}

func waitForRecipesTable(ctx context.Context, db *pgxpool.Pool) error {
	backoff := 10 * time.Second
	const maxBackoff = 5 * time.Minute

	for {
		var exists bool
		err := db.QueryRow(ctx,
			"SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'recipes')",
		).Scan(&exists)
		if err != nil {
			return fmt.Errorf("failed to check for recipes table: %w", err)
		}
		if exists {
			return nil
		}

		log.Printf("recipes table not found, retrying in %s...", backoff)
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(backoff):
		}

		backoff *= 2
		if backoff > maxBackoff {
			backoff = maxBackoff
		}
	}
}

func ensureSchema(ctx context.Context, db *pgxpool.Pool) error {
	_, err := db.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS recipe_nutrition (
			recipe_id INTEGER PRIMARY KEY REFERENCES recipes(id),
			calories INTEGER NOT NULL,
			protein_g NUMERIC(6,1) NOT NULL,
			carbs_g NUMERIC(6,1) NOT NULL,
			fat_g NUMERIC(6,1) NOT NULL,
			fiber_g NUMERIC(6,1) NOT NULL,
			analyzed_at TIMESTAMP NOT NULL DEFAULT NOW()
		)
	`)
	return err
}
