import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { UsersModule } from "../users/users.module";
import { ConfigModule } from "@nestjs/config";
import { MailModule } from "../mail/mail.module";
import { OperatorsModule } from "../operators/operators.module";
import { FirebaseModule } from "../firebase/firebase.module";
import { PlatformsModule } from "../platforms/platforms.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ClientsModule } from "../clients/clients.module";

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  imports: [
    UsersModule,
    ConfigModule,
    MailModule,
    OperatorsModule,
    FirebaseModule,
    MailModule,
    PlatformsModule,
    PrismaModule,
    ClientsModule,
  ],
})
export class AdminModule {}
