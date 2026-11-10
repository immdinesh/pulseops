import { Injectable, Logger } from '@nestjs/common';
import type { TelemetryEnvelope } from '../../common/telemetry.types';
import { TelemetryPublisher } from './telemetry-publisher';

/**
 * Temporary publisher for Step 2: doesn't send anything, just logs what it
 * WOULD send. Replaced by a Kafka publisher in Step 3.
 */
@Injectable()
export class LoggingTelemetryPublisher extends TelemetryPublisher {
  private readonly logger = new Logger(LoggingTelemetryPublisher.name);

  async publish(envelopes: TelemetryEnvelope[]): Promise<void> {
    const kind = envelopes[0]?.kind ?? 'unknown';
    const services = [...new Set(envelopes.map((e) => e.service))].join(', ');

    this.logger.log(`[dry-run] ${envelopes.length} ${kind}(s) from: ${services}`);
    // Print the first envelope in full so you can see the normalized shape.
    this.logger.debug(`First envelope:\n${JSON.stringify(envelopes[0], null, 2)}`);
  }
}
