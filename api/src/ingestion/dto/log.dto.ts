import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { LogLevel } from '../../common/telemetry.types';
import { MAX_BATCH_SIZE } from '../ingestion.constants';
import { TelemetryBaseDto } from './telemetry-base.dto';

export class LogDto extends TelemetryBaseDto {
  @IsEnum(LogLevel)
  level!: LogLevel;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10_000)
  message!: string;

  /** Links logs from different services that belong to the same request. */
  @IsOptional()
  @IsString()
  @MaxLength(128)
  traceId?: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}

/** Request body for POST /api/v1/ingest/logs */
export class LogBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BATCH_SIZE)
  @ValidateNested({ each: true }) // validate every item in the array…
  @Type(() => LogDto) //               …as a LogDto (turns plain JSON into LogDto objects)
  logs!: LogDto[];
}
