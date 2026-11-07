import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

const HEAP_LIMIT_BYTES = 300 * 1024 * 1024; // 300 MB

/**
 * Two kinds of health check, as used by Kubernetes, load balancers, etc.
 *
 *   GET /health/live   "Is the process alive?"         -> restart it if not
 *   GET /health/ready  "Can it do useful work right now?" -> stop sending traffic if not
 *
 * Liveness must NOT check the database: if Postgres goes down, restarting
 * the API won't fix Postgres, so we'd just restart in a loop.
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([() => this.memory.checkHeap('memory_heap', HEAP_LIMIT_BYTES)]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.db.pingCheck('database', { timeout: 1500 }),
      // Redis and Kafka checks are added in Step 3, when we start using them.
    ]);
  }
}
