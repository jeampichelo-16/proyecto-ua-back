import { forwardRef, Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { ClientsModule } from "../clients/clients.module";
import { QuotationsModule } from "../quotations/quotations.module";
import { OperatorsModule } from "../operators/operators.module";
import { PlatformsModule } from "../platforms/platforms.module";
import { FirebaseModule } from "../firebase/firebase.module";
import { MailModule } from "../mail/mail.module";

@Module({
  providers: [UsersService],
  exports: [UsersService],
  imports: [
    forwardRef(() => OperatorsModule), // 👈 FIX
    ClientsModule,
    QuotationsModule,
    PlatformsModule,
    FirebaseModule,
    MailModule,
  ],
  controllers: [UsersController],
})
export class UsersModule {}
