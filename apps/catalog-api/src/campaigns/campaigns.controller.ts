import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { BedrockClaims } from '../auth/auth.service';
import { CampaignsService } from './campaigns.service';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly svc: CampaignsService) {}

  @Get()
  list(
    @Query('game') game?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('segmentId') segmentId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.svc.list({
      game, status, type, segmentId, search,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @Post()
  create(
    @Body() body: Record<string, unknown> & { name: string },
    @CurrentUser() user: BedrockClaims,
  ) {
    return this.svc.create(body as never, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown> & { ifMatch: number },
    @CurrentUser() user: BedrockClaims,
  ) {
    const { ifMatch, ...patch } = body;
    return this.svc.update(id, patch, ifMatch, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: BedrockClaims) {
    return this.svc.remove(id, user);
  }
}
