import { Module } from '@nestjs/common';
import { FeaturesController } from './features.controller';
import { FeaturesService } from './features.service';
import { FeatureCatalogLoader } from './feature-catalog-loader';

@Module({
  controllers: [FeaturesController],
  providers: [FeaturesService, FeatureCatalogLoader],
  exports: [FeaturesService],
})
export class FeaturesModule {}
