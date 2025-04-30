import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
  imports: [PrismaModule],
})
export class ClientsModule {}
