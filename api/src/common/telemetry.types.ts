/**
 * Shared telemetry types used across modules (ingestion now; processing,
 * anomaly detection and correlation in later steps).
 *
 * Every piece of incoming telemetry is normalized into a TelemetryEnvelope:
 * the same outer shape for logs, metrics and events, with a type-specific
 * `payload` inside. Downstream consumers only need to understand one format.
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/** "Something changed" events. Often the fastest clue to a root cause. */
export enum SystemEventType {
  DEPLOY = 'deploy',
  RESTART = 'restart',
  CONFIG_CHANGE = 'config_change',
  SCALE = 'scale',
  FEATURE_FLAG = 'feature_flag',
  OTHER = 'other',
}

export type TelemetryKind = 'log' | 'metric' | 'event';

/** Free-form extra fields, e.g. { orderId: 42, region: "ap-south-1" }. */
export type Attributes = Record<string, unknown>;

export interface LogPayload {
  level: LogLevel;
  message: string;
  traceId?: string;
  attributes: Attributes;
}

export interface MetricPayload {
  name: string;
  value: number;
  unit?: string;
  tags: Record<string, string>;
}

export interface SystemEventPayload {
  type: SystemEventType;
  title: string;
  description?: string;
  attributes: Attributes;
}

interface Envelope<K extends TelemetryKind, P> {
  /** Unique id we assign on arrival (UUID). Used later for de-duplication. */
  id: string;
  kind: K;
  /** Which service produced it, e.g. "payments-service". */
  service: string;
  /** When it happened, according to the sender's clock (ISO 8601). */
  occurredAt: string;
  /** When PulseOps received it, according to OUR clock (ISO 8601). */
  receivedAt: string;
  payload: P;
}

export type LogEnvelope = Envelope<'log', LogPayload>;
export type MetricEnvelope = Envelope<'metric', MetricPayload>;
export type SystemEventEnvelope = Envelope<'event', SystemEventPayload>;

/** A "discriminated union": check `kind` and TypeScript knows the payload type. */
export type TelemetryEnvelope = LogEnvelope | MetricEnvelope | SystemEventEnvelope;
