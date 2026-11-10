import { IsISO8601, IsOptional, Matches } from 'class-validator';
import { SERVICE_NAME_PATTERN } from '../ingestion.constants';

/**
 * Fields every telemetry item has. LogDto, MetricDto and SystemEventDto
 * extend this, and class-validator applies these rules to them too.
 *
 * The `!` after `service` tells TypeScript "this will be set" (by the
 * ValidationPipe, from the request body), so strict mode doesn't complain.
 */
export class TelemetryBaseDto {
  @Matches(SERVICE_NAME_PATTERN, {
    message: 'service must be lowercase letters, digits and dashes, e.g. "payments-service"',
  })
  service!: string;

  /** When it happened. Optional: if missing, we use the time we received it. */
  @IsOptional()
  @IsISO8601({ strict: true }, { message: 'timestamp must be an ISO 8601 date, e.g. "2026-11-09T10:15:00Z"' })
  timestamp?: string;
}
