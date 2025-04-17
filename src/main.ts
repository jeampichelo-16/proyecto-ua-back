// src/main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { LoggerMiddleware } from "./common/middlewares/logger.middleware";
import * as cookieParser from "cookie-parser";
import { ConfigService } from "@nestjs/config";

import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { BadRequestException, ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const loggerMiddleware = new LoggerMiddleware();

  app.use(cookieParser());

  app.enableCors({
    origin: "http://localhost:5173",
    credentials: true,
  });

  app.setGlobalPrefix("api");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: () => {
        return new BadRequestException({
          statusCode: 400,
          message: 'Datos inválidos',
          error: 'Bad Request',
        });
      },
    })
  );

  app.use((req, res, next) => {
    loggerMiddleware.use(req, res, next);
  });

  // 🧠 Obtener configuración desde .env
  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT")!;

  // ✅ Swagger
  const config = new DocumentBuilder()
    .setTitle("NestJS Auth API")
    .setDescription("Documentación de autenticación, usuarios y correo")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  await app.listen(port);
}
bootstrap();
