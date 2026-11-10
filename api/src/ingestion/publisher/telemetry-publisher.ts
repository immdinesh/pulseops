import type { TelemetryEnvelope } from '../../common/telemetry.types';

/**
 * "Something that can send envelopes somewhere."
 *
 * IngestionService depends on this ABSTRACT class, not on a concrete one.
 * Today the module plugs in LoggingTelemetryPublisher (prints to console).
 * In Step 3 we plug in a KafkaTelemetryPublisher, and IngestionService
 * doesn't change at all. (This is the Dependency Inversion principle.)
 *
 * We use an abstract class rather than an interface because TypeScript
 * interfaces disappear at runtime, and Nest needs a real value as the
 * injection token.
 */
export abstract class TelemetryPublisher {
  abstract publish(envelopes: TelemetryEnvelope[]): Promise<void>;
}
