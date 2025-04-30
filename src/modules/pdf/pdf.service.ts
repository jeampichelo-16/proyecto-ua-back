import { Injectable } from "@nestjs/common";
import { Client, Operator, Platform, Quotation } from "@prisma/client";
import * as streamBuffers from "stream-buffers";
const PDFDocument = require("pdfkit");

@Injectable()
export class PdfService {
  async generateQuotationPdf(
    quotation: Quotation,
    client: Client,
    operator: Operator,
    platform: Platform
  ): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50 });
    const buffer = new streamBuffers.WritableStreamBuffer();
    doc.pipe(buffer);

    const yellow = "#fff4cc";
    const gray = "#dddddd";
    const leftX = 50;
    const rightX = 400;
    const contentWidth = 510;

    // Logo y Título
    doc.image("src/assets/logo.png", leftX, 40, { width: 60 });
    doc
      .fontSize(18)
      .fillColor("black")
      .text("COTIZACIÓN", rightX, 50, { align: "right" });

    // Empresa Info
    doc.fontSize(10).fillColor("black").font("Helvetica");
    let y = 100;
    doc
      .text("[Dirección]", leftX, y)
      .text("[Ciudad, Estado ZIP]")
      .text("Sitio Web: tudominio.com")
      .text("Teléfono: [000-000-0000]")
      .text("Asesor de venta: [Nombre del vendedor]");

    // Cotización Info
    doc
      .text("FECHA:", rightX, y)
      .text(new Date().toLocaleDateString("es-PE"), rightX + 70, y)
      .text("COTIZACIÓN #:", rightX, y + 15)
      .text(`#${quotation.id}`, rightX + 70, y + 15)
      .text("CLIENTE ID:", rightX, y + 30)
      .text(`${client.id}`, rightX + 70, y + 30);

    // Sección CLIENTE
    y = 175;
    doc.rect(leftX, y, contentWidth, 20).fill(yellow);
    doc
      .fillColor("black")
      .font("Helvetica-Bold")
      .text("CLIENTE", leftX + 5, y + 5);

    y += 30;
    doc.font("Helvetica").fontSize(10).fillColor("black");
    const lineHeight = 15;
    doc
      .text("Nombre:", leftX, y)
      .text(client.name, leftX + 80, y)
      .text("Dirección:", leftX, y + lineHeight)
      .text(client.address ?? "-", leftX + 80, y + lineHeight)
      .text("Email:", leftX, y + lineHeight * 2)
      .text(client.email ?? "-", leftX + 80, y + lineHeight * 2)
      .text("Teléfono:", leftX, y + lineHeight * 3)
      .text(client.phone ?? "-", leftX + 80, y + lineHeight * 3);

    // Encabezado Tabla
    y += lineHeight * 5;
    const headers = ["DESCRIPCIÓN", "PRECIO UNIT.", "CANT.", "TOTAL"];
    const colWidths = [250, 90, 60, 100];
    doc.rect(leftX, y, contentWidth, 25).fill(yellow);
    doc.font("Helvetica-Bold").fillColor("black").fontSize(10);
    let colX = leftX + 5;
    headers.forEach((h, i) => {
      doc.text(h, colX, y + 7, { width: colWidths[i], align: "left" });
      colX += colWidths[i];
    });

    // Fila Producto
    y += 30;
    const rowHeight = 60;
    doc.rect(leftX, y, contentWidth, rowHeight).stroke(gray);
    doc.font("Helvetica").fontSize(10);

    const description = `Marca: ${platform.brand}\nModelo: ${platform.model}\nTipo: ${platform.typePlatform}`;
    colX = leftX + 5;
    doc.text(description, colX, y + 8, { width: colWidths[0] - 10 });
    doc.text(platform.price.toFixed(2), colX + colWidths[0], y + 22);
    doc.text(
      quotation.days.toString(),
      colX + colWidths[0] + colWidths[1],
      y + 22
    );
    doc.text(
      quotation.subtotal.toFixed(2),
      colX + colWidths[0] + colWidths[1] + colWidths[2],
      y + 22
    );

    // Totales
    y += rowHeight + 10;
    doc.font("Helvetica-Bold");
    doc
      .text("Subtotal", rightX, y)
      .text(`S/ ${quotation.subtotal.toFixed(2)}`, rightX + 80, y, {
        align: "right",
      });
    doc
      .font("Helvetica")
      .text("IGV (18%)", rightX, y + 15)
      .text(`S/ ${quotation.igv.toFixed(2)}`, rightX + 80, y + 15, {
        align: "right",
      });
    doc
      .font("Helvetica-Bold")
      .text("TOTAL", rightX, y + 30)
      .text(`S/ ${quotation.total.toFixed(2)}`, rightX + 80, y + 30, {
        align: "right",
      });

    // Términos y Condiciones
    y += 70;
    doc.rect(leftX, y, contentWidth, 20).fill(yellow);
    doc
      .fillColor("black")
      .font("Helvetica-Bold")
      .text("TÉRMINOS Y CONDICIONES", leftX + 5, y + 5);

    y += 25;
    doc.font("Helvetica").fontSize(9).fillColor("black");
    const terms = [
      "1. Al cliente se le cobrará después de aceptada esta cotización",
      "2. El pago será debitado antes de la entrega de bienes y servicios",
      "3. Por favor enviar la cotización firmada al email indicado anteriormente",
    ];
    terms.forEach((line, i) => {
      doc.text(line, leftX, y + i * 12);
    });

    // Footer (siempre en la parte inferior de la hoja)
    doc
      .fontSize(8)
      .fillColor("gray")
      .text(
        "Si usted tiene alguna pregunta sobre esta cotización, por favor, póngase en contacto con nosotros",
        leftX,
        730,
        { align: "center" }
      )
      .text("MANSERCOM S.A.C | ventas@mansercom.pe | +51 949 128 854", {
        align: "center",
      });

    doc.end();

    return new Promise((resolve, reject) => {
      buffer.on("finish", () => resolve(buffer.getContents() as Buffer));
      buffer.on("error", reject);
    });
  }
}
