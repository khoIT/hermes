import { Module } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { BoardsController } from './boards.controller';
import { BoardsSeederService } from './boards-seeder.service';

@Module({
  providers: [BoardsService, BoardsSeederService],
  controllers: [BoardsController],
})
export class BoardsModule {}
