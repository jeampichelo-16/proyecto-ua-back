// src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Para que esté disponible globalmente
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // 👈 permite su uso en otros módulos
})
export class PrismaModule {}
