import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { MailModule } from "./mail/mail.module";

import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { validationSchema } from "./config/validation.schema";
import { AdminModule } from "./admin/admin.module";
import { PrismaService } from "./prisma/prisma.service";
import { PrismaModule } from "./prisma/prisma.module";
import { EmployeeModule } from "./employee/employee.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // hace que las variables .env estén disponibles en toda la app
      validationSchema,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // tiempo en segundos
          limit: 5, // número de peticiones permitidas
          
        },
      ],
    }),
    AuthModule,
    UsersModule,
    MailModule,
    ConfigModule,
    AdminModule,
    PrismaModule,
    EmployeeModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    PrismaService,
  ],
})
export class AppModule {}
