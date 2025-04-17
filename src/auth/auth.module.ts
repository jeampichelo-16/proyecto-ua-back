import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { UsersModule } from "../users/users.module";
import { ConfigModule } from "@nestjs/config";
import { MailModule } from "src/mail/mail.module";

@Module({
  imports: [
    JwtModule.register({}),
    UsersModule, // ✅ Importa módulo de usuarios para poder usar UsersService
    ConfigModule,
    MailModule, // ✅ Importa módulo de correo para poder usar MailService
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService],
})
export class AuthModule {}
