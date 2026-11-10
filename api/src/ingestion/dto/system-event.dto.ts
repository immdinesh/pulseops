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
import { SystemEventType } from '../../common/telemetry.types';
import { MAX_BATCH_SIZE } from '../ingestion.constants';
import { TelemetryBaseDto } from './telemetry-base.dto';

export class SystemEventDto extends TelemetryBaseDto {
  @IsEnum(SystemEventType)
  type!: SystemEventType;

  /** Short summary, e.g. "Deployed payments-service v1.4.2". */
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5_000)
  description?: string;

  /** e.g. { version: "1.4.2", commit: "a1b2c3d", author: "ci-bot" } */
  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;
}

/** Request body for POST /api/v1/ingest/events */
export class SystemEventBatchDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BATCH_SIZE)
  @ValidateNested({ each: true })
  @Type(() => SystemEventDto)
  events!: SystemEventDto[];
}
