import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { PrismaClient } from "@prisma/client";
import { ClientsModule } from "../clients/clients.module";
import { QuotationsModule } from "../quotations/quotations.module";

@Module({
  providers: [UsersService],
  exports: [UsersService],
  imports: [PrismaClient, ClientsModule, QuotationsModule],
  controllers: [UsersController],
})
export class UsersModule {}
