import { Module } from "@nestjs/common";
import { QuotationsController } from "./quotations.controller";
import { QuotationsService } from "./quotations.service";
import { PrismaModule } from "../prisma/prisma.module";
import { PdfModule } from "../pdf/pdf.module";
import { MailModule } from "../mail/mail.module";
import { FirebaseModule } from "../firebase/firebase.module";

@Module({
  controllers: [QuotationsController],
  providers: [QuotationsService],
  exports: [QuotationsService],
  imports: [PrismaModule, PdfModule, MailModule, FirebaseModule],
})
export class QuotationsModule {}
