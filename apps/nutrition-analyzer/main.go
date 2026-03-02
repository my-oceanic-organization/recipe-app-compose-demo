package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	redisURL := getEnv("QUEUE_REDIS_URL", "redis://br-queue:6379")
	dbURL := os.Getenv("DATABASE_URL")
	port := getEnv("PORT", "8080")

	dbPool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbPool.Close()

	if err := dbPool.Ping(ctx); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	log.Println("Connected to database")

	if err := waitForRecipesTable(ctx, dbPool); err != nil {
		log.Fatalf("Failed waiting for recipes table: %v", err)
	}
	log.Println("recipes table found")

	if err := ensureSchema(ctx, dbPool); err != nil {
		log.Fatalf("Failed to create schema: %v", err)
	}
	log.Println("Database schema ready")

	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatalf("Failed to parse Redis URL: %v", err)
	}
	rdb := redis.NewClient(opts)

	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	log.Println("Connected to Redis")

	go workerLoop(ctx, rdb, dbPool)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", handleHealth(dbPool, rdb))

	server := &http.Server{Addr: ":" + port, Handler: mux}
	go func() {
		log.Printf("HTTP server listening on :%s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down...")
	cancel()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	server.Shutdown(shutdownCtx)
	rdb.Close()
	log.Println("Shutdown complete")
}

func workerLoop(ctx context.Context, rdb *redis.Client, db *pgxpool.Pool) {
	log.Println("Worker loop started, waiting for jobs on 'jobs:nutrition'")
	for {
		select {
		case <-ctx.Done():
			log.Println("Worker loop stopping")
			return
		default:
		}

		result, err := rdb.BRPop(ctx, 5*time.Second, "jobs:nutrition").Result()
		if err != nil {
			if err == redis.Nil || strings.Contains(err.Error(), "context canceled") {
				continue
			}
			log.Printf("Redis BRPOP error: %v", err)
			time.Sleep(time.Second)
			continue
		}

		payload := result[1]
		var job NutritionJob
		if err := json.Unmarshal([]byte(payload), &job); err != nil {
			log.Printf("Failed to unmarshal job: %v", err)
			continue
		}

		log.Printf("Processing nutrition analysis for recipe %d (attempt %d)", job.RecipeID, job.Attempt)

		if err := processNutritionJob(ctx, db, &job); err != nil {
			log.Printf("Job failed for recipe %d: %v", job.RecipeID, err)

			if job.Attempt < 3 {
				job.Attempt++
				retryPayload, _ := json.Marshal(job)
				rdb.LPush(ctx, "jobs:nutrition", retryPayload)
				log.Printf("Requeued recipe %d (attempt %d)", job.RecipeID, job.Attempt)
			} else {
				log.Printf("Job permanently failed for recipe %d after %d attempts", job.RecipeID, job.Attempt)
			}
			continue
		}

		log.Printf("Nutrition analysis complete for recipe %d", job.RecipeID)
	}
}

func handleHealth(db *pgxpool.Pool, rdb *redis.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		dbOK := db.Ping(r.Context()) == nil
		redisOK := rdb.Ping(r.Context()).Err() == nil

		status := "ok"
		if !dbOK || !redisOK {
			status = "degraded"
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"status":    status,
			"database":  dbOK,
			"redis":     redisOK,
			"timestamp": time.Now().Format(time.RFC3339),
		})
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
