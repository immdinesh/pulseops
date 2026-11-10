import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  LogEnvelope,
  MetricEnvelope,
  SystemEventEnvelope,
  TelemetryEnvelope,
} from '../common/telemetry.types';
import type { LogBatchDto } from './dto/log.dto';
import type { MetricBatchDto } from './dto/metric.dto';
import type { SystemEventBatchDto } from './dto/system-event.dto';
import type { TelemetryBaseDto } from './dto/telemetry-base.dto';
import { TelemetryPublisher } from './publisher/telemetry-publisher';

export interface IngestResult {
  accepted: number;
  ids: string[];
}

/**
 * Turns validated request DTOs into TelemetryEnvelopes and hands them to the
 * publisher. It knows nothing about HTTP (that's the controller's job) and
 * nothing about Kafka (that's the publisher's job).
 */
@Injectable()
export class IngestionService {
  constructor(private readonly publisher: TelemetryPublisher) {}

  async ingestLogs({ logs }: LogBatchDto): Promise<IngestResult> {
    const receivedAt = new Date().toISOString();
    const envelopes = logs.map(
      (log): LogEnvelope => ({
        ...this.envelopeBase(log, receivedAt),
        kind: 'log',
        payload: {
          level: log.level,
          message: log.message,
          traceId: log.traceId,
          attributes: log.attributes ?? {},
        },
      }),
    );
    return this.publish(envelopes);
  }

  async ingestMetrics({ metrics }: MetricBatchDto): Promise<IngestResult> {
    const receivedAt = new Date().toISOString();
    const envelopes = metrics.map(
      (metric): MetricEnvelope => ({
        ...this.envelopeBase(metric, receivedAt),
        kind: 'metric',
        payload: {
          name: metric.name,
          value: metric.value,
          unit: metric.unit,
          tags: metric.tags ?? {},
        },
      }),
    );
    return this.publish(envelopes);
  }

  async ingestEvents({ events }: SystemEventBatchDto): Promise<IngestResult> {
    const receivedAt = new Date().toISOString();
    const envelopes = events.map(
      (event): SystemEventEnvelope => ({
        ...this.envelopeBase(event, receivedAt),
        kind: 'event',
        payload: {
          type: event.type,
          title: event.title,
          description: event.description,
          attributes: event.attributes ?? {},
        },
      }),
    );
    return this.publish(envelopes);
  }

  /** The fields every envelope shares. */
  private envelopeBase(item: TelemetryBaseDto, receivedAt: string) {
    return {
      id: randomUUID(),
      service: item.service,
      // Normalize any valid ISO format ("+05:30" offsets etc.) to UTC "Z" form.
      occurredAt: item.timestamp ? new Date(item.timestamp).toISOString() : receivedAt,
      receivedAt,
    };
  }

  private async publish(envelopes: TelemetryEnvelope[]): Promise<IngestResult> {
    await this.publisher.publish(envelopes);
    return { accepted: envelopes.length, ids: envelopes.map((e) => e.id) };
  }
}
