package database

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

func NewPostgresPool(dbURL string) (*pgxpool.Pool, error) {
	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		return nil, fmt.Errorf("unable to connect to database: %v", err)
	}

	// Read migration schema
	schemaBytes, err := os.ReadFile("internal/database/migrations/001_initial_schema.sql")
	if err == nil {
		_, err = pool.Exec(ctx, string(schemaBytes))
		if err != nil {
			fmt.Printf("Warning: failed to run migration: %v\n", err)
		}
	} else {
		fmt.Printf("Warning: failed to read migration file: %v\n", err)
	}

	return pool, nil
}
