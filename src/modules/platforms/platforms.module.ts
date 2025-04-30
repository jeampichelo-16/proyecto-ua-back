import { Module } from "@nestjs/common";
import { PlatformsController } from "./platforms.controller";
import { PlatformsService } from "./platforms.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  controllers: [PlatformsController],
  providers: [PlatformsService],
  exports: [PlatformsService],
  imports: [PrismaModule],
})
export class PlatformsModule {}
