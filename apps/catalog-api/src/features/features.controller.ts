import { Controller, Get, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { Public } from '../common/public.decorator';
import { FeaturesService } from './features.service';

@Public()
@Controller('features')
export class FeaturesController {
  constructor(private readonly svc: FeaturesService) {}

  @Get()
  list() {
    return this.svc.listAll();
  }

  @Get(':name')
  getOne(@Param('name') name: string) {
    return this.svc.getOne(name);
  }

  @Get(':name/distribution')
  getDistribution(
    @Param('name') name: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.svc.getDistribution(name, Math.min(Math.max(days, 1), 180));
  }

  @Get(':name/used-by')
  getUsedBy(@Param('name') name: string) {
    return this.svc.getUsedBy(name);
  }

  @Get(':name/audience-count')
  getAudienceCount(
    @Param('name') name: string,
    @Query('op') op: string,
    @Query('value') value: string,
  ) {
    const allowed = new Set(['gt', 'lt', 'gte', 'lte', 'eq']);
    if (!allowed.has(op)) {
      throw new Error(`unsupported op: ${op}`);
    }
    return this.svc.getAudienceCount(name, op as 'gt'|'lt'|'gte'|'lte'|'eq', value);
  }

  @Get(':name/quantiles')
  getQuantiles(@Param('name') name: string) {
    return this.svc.getQuantiles(name);
  }

  @Get(':name/samples')
  getSamples(
    @Param('name') name: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.svc.getSamples(name, limit);
  }

  @Get(':name/pipeline-health')
  getPipelineHealth(
    @Param('name') name: string,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.svc.getPipelineHealth(name, Math.min(Math.max(days, 1), 180));
  }

  @Get(':name/outliers')
  getOutliers(
    @Param('name') name: string,
    @Query('topK', new DefaultValuePipe(5), ParseIntPipe) topK: number,
  ) {
    return this.svc.getOutliers(name, topK);
  }

  @Get(':name/coverage-segmentation')
  getCoverageSegmentation(@Param('name') name: string) {
    return this.svc.getCoverageSegmentation(name);
  }

  @Get(':name/top-segments-using')
  getTopSegmentsUsing(@Param('name') name: string) {
    return this.svc.getTopSegmentsUsing(name);
  }

  @Get(':name/correlations')
  getCorrelations(
    @Param('name') name: string,
    @Query('topK', new DefaultValuePipe(5), ParseIntPipe) topK: number,
  ) {
    return this.svc.getCorrelations(name, topK);
  }
}
