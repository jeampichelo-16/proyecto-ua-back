import { forwardRef, Module } from "@nestjs/common";
import { OperatorsService } from "./operators.service";
import { OperatorsController } from "./operators.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { UsersModule } from "../users/users.module";

@Module({
  providers: [OperatorsService],
  imports: [
    PrismaModule,
    forwardRef(() => UsersModule), // 👈 FIX
  ],
  exports: [OperatorsService],
  controllers: [OperatorsController],
})
export class OperatorsModule {}
