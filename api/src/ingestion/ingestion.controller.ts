import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LogBatchDto } from './dto/log.dto';
import { MetricBatchDto } from './dto/metric.dto';
import { SystemEventBatchDto } from './dto/system-event.dto';
import { IngestionService, type IngestResult } from './ingestion.service';

/**
 * HTTP entry point for telemetry. Routes (with the global prefix):
 *   POST /api/v1/ingest/logs
 *   POST /api/v1/ingest/metrics
 *   POST /api/v1/ingest/events
 *
 * By the time a handler runs, the global ValidationPipe has already checked
 * the body against the DTO. Invalid bodies never reach this code (400).
 *
 * We return 202 Accepted, not 201 Created: "we've received it and will
 * process it", not "it's done". Processing happens asynchronously (Step 3).
 */
@Controller('ingest')
export class IngestionController {
  constructor(private readonly ingestion: IngestionService) {}

  @Post('logs')
  @HttpCode(HttpStatus.ACCEPTED)
  ingestLogs(@Body() body: LogBatchDto): Promise<IngestResult> {
    return this.ingestion.ingestLogs(body);
  }

  @Post('metrics')
  @HttpCode(HttpStatus.ACCEPTED)
  ingestMetrics(@Body() body: MetricBatchDto): Promise<IngestResult> {
    return this.ingestion.ingestMetrics(body);
  }

  @Post('events')
  @HttpCode(HttpStatus.ACCEPTED)
  ingestEvents(@Body() body: SystemEventBatchDto): Promise<IngestResult> {
    return this.ingestion.ingestEvents(body);
  }
}
