import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import hbs from "nodemailer-express-handlebars";
import { join } from "path";
import { existsSync } from "fs";

interface TemplatedMail {
  to: string;
  from: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

@Injectable()
export class MailService implements OnModuleInit {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const templatesPath = join(__dirname, "templates");

    this.transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: this.configService.get("MAIL_USER"),
        pass: this.configService.get("MAIL_PASS"),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    this.transporter.use(
      "compile",
      hbs({
        viewEngine: {
          partialsDir: templatesPath,
          defaultLayout: false,
        },
        viewPath: templatesPath,
        extName: ".hbs",
      })
    );
  }

  async sendTemplateEmail(
    to: string,
    subject: string,
    template: string,
    context: Record<string, any>
  ): Promise<void> {
    const mailOptions: TemplatedMail = {
      from: '"Tu App" <no-reply@tuapp.com>',
      to,
      subject,
      template,
      context,
    };

    await this.transporter.sendMail(mailOptions as any);
  }
}
