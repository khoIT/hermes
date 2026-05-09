import { Body, Controller, Post } from '@nestjs/common';
import { AudienceService } from './audience.service';
import type { Predicate } from './predicate-translator';

interface CountRequest {
  predicate: Predicate;
  limit?: number;     // sample uid cap, default 100
  asOf?: string;      // ISODate — currently informational; data is "now" only
}

@Controller('audience')
export class AudienceController {
  constructor(private readonly svc: AudienceService) {}

  @Post('count')
  async count(@Body() body: CountRequest) {
    if (!body || typeof body !== 'object' || !body.predicate) {
      throw new Error('body must include `predicate`');
    }
    const limit = Math.min(Math.max(body.limit ?? 100, 1), 1000);
    return this.svc.count(body.predicate, limit);
  }
}
