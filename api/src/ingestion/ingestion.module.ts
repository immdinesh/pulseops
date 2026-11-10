import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { LoggingTelemetryPublisher } from './publisher/logging-telemetry.publisher';
import { TelemetryPublisher } from './publisher/telemetry-publisher';

@Module({
  controllers: [IngestionController],
  providers: [
    IngestionService,
    // "Whenever someone asks for TelemetryPublisher, give them a LoggingTelemetryPublisher."
    // Step 3 changes only this line, to the Kafka publisher.
    { provide: TelemetryPublisher, useClass: LoggingTelemetryPublisher },
  ],
})
export class IngestionModule {}
