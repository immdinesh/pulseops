/** Max items per request. Bigger batches must be split by the sender. */
export const MAX_BATCH_SIZE = 500;

/** Lowercase letters, digits and dashes, e.g. "payments-service". */
export const SERVICE_NAME_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/;

/** Metric names like "http_latency_ms" or "db.pool.active". */
export const METRIC_NAME_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_.]{0,127}$/;
