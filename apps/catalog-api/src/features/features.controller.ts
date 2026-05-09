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
}
