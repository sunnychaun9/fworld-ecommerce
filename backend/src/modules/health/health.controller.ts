import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

import { Public } from '../../auth/decorators/public.decorator';
import { HealthService } from './health.service';

/**
 * System health endpoints (public infrastructure probes; excluded from the global
 * API prefix and rate limiting).
 * - `GET /health`        full status (database, redis, memory, uptime, version)
 * - `GET /health/live`   liveness (process is up)
 * - `GET /health/ready`  readiness (database reachable; 503 otherwise)
 *
 * `@SkipThrottle()`: orchestrator/load-balancer probes are frequent and often
 * share a source IP, so they must not be rate-limited into false 429s.
 */
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Public()
  @Get()
  check() {
    return this.health.check();
  }

  @Public()
  @Get('live')
  liveness() {
    return this.health.liveness();
  }

  @Public()
  @Get('ready')
  readiness() {
    return this.health.readiness();
  }
}
