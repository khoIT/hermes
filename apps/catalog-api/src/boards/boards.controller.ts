import {
  Body, Controller, Delete, Get, Param, Patch, Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import type { BedrockClaims } from '../auth/auth.service';
import { BoardsService } from './boards.service';

@Controller('boards')
export class BoardsController {
  constructor(private readonly svc: BoardsService) {}

  @Get()
  list() {
    return this.svc.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @Post()
  create(
    @Body() body: { name: string; sections?: { id: string; title: string; isExpanded: boolean }[] },
    @CurrentUser() user: BedrockClaims,
  ) {
    return this.svc.create(body, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; sections?: { id: string; title: string; isExpanded: boolean }[] },
    @CurrentUser() user: BedrockClaims,
  ) {
    return this.svc.update(id, body, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: BedrockClaims) {
    return this.svc.remove(id, user);
  }

  // Pin a widget to a board section. Defaults to the 'pinned' section
  // when sectionId is omitted — covers the chat → Pin-to-Board flow.
  @Post(':id/cards')
  pinCard(
    @Param('id') boardId: string,
    @Body() body: { sectionId?: string; widget: unknown; sourceThreadId?: string },
    @CurrentUser() user: BedrockClaims,
  ) {
    return this.svc.pinCard(boardId, body, user);
  }

  @Delete(':id/cards/:cardId')
  unpinCard(
    @Param('id') boardId: string,
    @Param('cardId') cardId: string,
    @CurrentUser() user: BedrockClaims,
  ) {
    return this.svc.unpinCard(boardId, cardId, user);
  }
}
