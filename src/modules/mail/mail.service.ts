import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { handleServiceError } from "src/common/utils/handle-error.util";
import { readFileSync } from "fs";
import { compile } from "handlebars";
import { join } from "path";

interface TemplatedMail {
  to: string;
  from: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

@Injectable()
export class MailService {
  private resend: Resend;

  constructor(private readonly configService: ConfigService) {
    this.resend = new Resend(this.configService.get<string>("RESEND_API_KEY"));
    console.log("Resend API Key:", this.configService.get<string>("RESEND_API_KEY"));

  }

  private renderTemplate(
    templateName: string,
    context: Record<string, any>
  ): string {
    const filePath = join(
      __dirname,
      "../../modules/mail/templates",
      `${templateName}.hbs`
    );
    const templateStr = readFileSync(filePath, "utf8");
    const template = compile(templateStr);
    return template(context);
  }

  async sendTemplateEmail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>
  ) {
    try {
      const html = this.renderTemplate(template, context);

      await this.resend.emails.send({
        from: "no-reply@mansercomioautonoma.online",
        to,
        subject,
        html,
      });
    } catch (error) {
      handleServiceError(error, "Error al enviar correo con Resend");
    }
  }
}
