import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { MailModule } from "./modules/mail/mail.module";

import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { validationSchema } from "./config/validation.schema";
import { AdminModule } from "./modules/admin/admin.module";
import { PrismaService } from "./modules/prisma/prisma.service";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { EmployeeModule } from "./modules/employee/employee.module";
import { ClientsModule } from './modules/clients/clients.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { PlatformsModule } from './modules/platforms/platforms.module';
import { OperatorsModule } from './modules/operators/operators.module';
import { FirebaseModule } from './modules/firebase/firebase.module';

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
    ClientsModule,
    QuotationsModule,
    PlatformsModule,
    OperatorsModule,
    FirebaseModule,
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
