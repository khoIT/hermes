import { Module } from '@nestjs/common';
import { AudienceController } from './audience.controller';
import { AudienceService } from './audience.service';
import { ProfilePgClient } from '../trino-explorer/profile-pg-client';

@Module({
  controllers: [AudienceController],
  providers: [AudienceService, ProfilePgClient],
  exports: [AudienceService],
})
export class AudienceModule {}
