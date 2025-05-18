import { Module } from "@nestjs/common";
import { QuotationsController } from "./quotations.controller";
import { QuotationsService } from "./quotations.service";
import { PrismaModule } from "../prisma/prisma.module";
import { PdfModule } from "../pdf/pdf.module";
import { FirebaseModule } from "../firebase/firebase.module";
import { ClientsModule } from "../clients/clients.module";
import { PlatformsModule } from "../platforms/platforms.module";

@Module({
  controllers: [QuotationsController],
  providers: [QuotationsService],
  exports: [QuotationsService],
  imports: [PrismaModule, PdfModule, FirebaseModule, ClientsModule, PlatformsModule],
})
export class QuotationsModule {}
