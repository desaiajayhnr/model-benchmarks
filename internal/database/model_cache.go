package database

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

func (r *Repository) CreateModelCache(ctx context.Context, m *ModelCache) (string, error) {
	var id string
	err := r.pool.QueryRow(ctx,
		`INSERT INTO model_cache (hf_id, hf_revision, s3_uri, display_name, status)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id`,
		m.HfID, m.HfRevision, m.S3URI, m.DisplayName, m.Status,
	).Scan(&id)
	if err != nil {
		return "", fmt.Errorf("insert model cache: %w", err)
	}
	return id, nil
}

func (r *Repository) GetModelCache(ctx context.Context, id string) (*ModelCache, error) {
	var m ModelCache
	err := r.pool.QueryRow(ctx,
		`SELECT id, hf_id, hf_revision, s3_uri, display_name, size_bytes,
		        status, error_message, job_name, cached_at, created_at
		 FROM model_cache WHERE id = $1`, id,
	).Scan(&m.ID, &m.HfID, &m.HfRevision, &m.S3URI, &m.DisplayName, &m.SizeBytes,
		&m.Status, &m.ErrorMessage, &m.JobName, &m.CachedAt, &m.CreatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("query model cache: %w", err)
	}
	return &m, nil
}

func (r *Repository) GetModelCacheByHfID(ctx context.Context, hfID, revision string) (*ModelCache, error) {
	var m ModelCache
	err := r.pool.QueryRow(ctx,
		`SELECT id, hf_id, hf_revision, s3_uri, display_name, size_bytes,
		        status, error_message, job_name, cached_at, created_at
		 FROM model_cache WHERE hf_id = $1 AND hf_revision = $2`, hfID, revision,
	).Scan(&m.ID, &m.HfID, &m.HfRevision, &m.S3URI, &m.DisplayName, &m.SizeBytes,
		&m.Status, &m.ErrorMessage, &m.JobName, &m.CachedAt, &m.CreatedAt)
	if err == pgx.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("query model cache by hf_id: %w", err)
	}
	return &m, nil
}

func (r *Repository) ListModelCache(ctx context.Context) ([]ModelCache, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, hf_id, hf_revision, s3_uri, display_name, size_bytes,
		        status, error_message, job_name, cached_at, created_at
		 FROM model_cache ORDER BY created_at DESC`)
	if err != nil {
		return nil, fmt.Errorf("list model cache: %w", err)
	}
	defer rows.Close()

	var items []ModelCache
	for rows.Next() {
		var m ModelCache
		if err := rows.Scan(&m.ID, &m.HfID, &m.HfRevision, &m.S3URI, &m.DisplayName, &m.SizeBytes,
			&m.Status, &m.ErrorMessage, &m.JobName, &m.CachedAt, &m.CreatedAt); err != nil {
			return nil, fmt.Errorf("scan model cache row: %w", err)
		}
		items = append(items, m)
	}
	return items, rows.Err()
}

func (r *Repository) UpdateModelCacheStatus(ctx context.Context, id, status string, errMsg *string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE model_cache SET status = $1, error_message = $2, job_name = COALESCE(job_name, job_name) WHERE id = $3`,
		status, errMsg, id)
	if err != nil {
		return fmt.Errorf("update model cache status: %w", err)
	}
	return nil
}

func (r *Repository) UpdateModelCacheComplete(ctx context.Context, id string, sizeBytes int64) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE model_cache SET status = 'cached', size_bytes = $1, cached_at = $2 WHERE id = $3`,
		sizeBytes, time.Now(), id)
	if err != nil {
		return fmt.Errorf("update model cache complete: %w", err)
	}
	return nil
}

func (r *Repository) DeleteModelCache(ctx context.Context, id string) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM model_cache WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete model cache: %w", err)
	}
	return nil
}
