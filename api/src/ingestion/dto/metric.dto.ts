import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MAX_BATCH_SIZE, METRIC_NAME_PATTERN } from '../ingestion.constants';
import { TelemetryBaseDto } from './telemetry-base.dto';

export class MetricDto extends TelemetryBaseDto {
  @Matches(METRIC_NAME_PATTERN, {
    message: 'name must look like "http_latency_ms" (letters, digits, _ and .)',
  })
  name!: string;

  /** NaN and Infinity are rejected: they would break averages and anomaly maths. */
  @IsNumber({ allowNaN: false, allowInfinity: false })
  value!: number;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  unit?: string;

  /** Dimensions to slice by, e.g. { endpoint: "/checkout", region: "eu" }. */
  @IsOptional()
  @IsObject()
  tags?: Record<string, string>;
}

/** Request body for POST /api/v1/ingest/metrics */
export class MetricBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BATCH_SIZE)
  @ValidateNested({ each: true })
  @Type(() => MetricDto)
  metrics!: MetricDto[];
}
