import { Injectable } from "@nestjs/common";
import { Client, Platform, Quotation } from "@prisma/client";
import * as streamBuffers from "stream-buffers";
const PDFDocument = require("pdfkit");

@Injectable()
export class PdfService {
  async generateQuotationPdf(
    quotation: Quotation,
    client: Client,
    dailyOperatorCost: number,
    platform: Platform,
    updatedSubtotal: number,
    deliveryAmount: number,
    isNeedOperator: boolean,
    days: number
  ): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const buffer = new streamBuffers.WritableStreamBuffer();
    doc.pipe(buffer);

    const yellow = "#fff4cc";
    const gray = "#dddddd";
    const lightGray = "#f2f2f2";
    const leftX = 50;
    const rightX = 400;
    const contentWidth = 510;

    const formatDate = (dateStr: string) =>
      new Date(dateStr).toLocaleDateString("es-PE");

    const rentalPeriod = `${formatDate(
      quotation.startDate.toString()
    )} al ${formatDate(quotation.endDate.toString())}`;

    // Logo y título
    doc.image("src/assets/logo.png", leftX, 40, { width: 60 });
    doc
      .fontSize(18)
      .fillColor("black")
      .text("COTIZACIÓN", rightX, 50, { align: "right" });

    // Empresa info
    doc.fontSize(10).fillColor("black").font("Helvetica");
    let y = 100;
    doc
      .text("Dirección:", leftX, y)
      .text("Calle Los Cactus Nro. 265 Int. 301", leftX + 80, y)
      .text("Ciudad:", leftX, y + 15)
      .text("Lima", leftX + 80, y + 15)
      .text("Sitio Web:", leftX, y + 30)
      .text("https://mansercom.pe/", leftX + 80, y + 30)
      .text("Teléfono:", leftX, y + 45)
      .text("+51 949 128 854", leftX + 80, y + 45);

    // Cotización Info
    const infoStartY = 100;
    const infoGap = 20;
    const labelX = rightX;
    const valueX = rightX + 110;
    doc.fontSize(10);

    doc.font("Helvetica-Bold").text("FECHA:", labelX, infoStartY);
    doc
      .font("Helvetica")
      .text(new Date().toLocaleDateString("es-PE"), valueX, infoStartY, {
        width: 100,
        align: "left",
        continued: false,
      });

    doc
      .font("Helvetica-Bold")
      .text("COTIZACIÓN #:", labelX, infoStartY + infoGap);
    doc
      .font("Helvetica")
      .text(`#${quotation.id}`, valueX, infoStartY + infoGap);

    doc
      .font("Helvetica-Bold")
      .text("CLIENTE ID:", labelX, infoStartY + infoGap * 2);
    doc
      .font("Helvetica")
      .text(`${client.id}`, valueX, infoStartY + infoGap * 2);

    // CLIENTE
    y = 180;
    doc.rect(leftX, y, contentWidth, 20).fill(yellow);
    doc
      .fillColor("black")
      .font("Helvetica-Bold")
      .text("CLIENTE", leftX + 5, y + 5);

    y += 30;
    doc.font("Helvetica").fontSize(10);
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

    // Encabezado tabla
    y += lineHeight * 5;
    const headers = [
      "DESCRIPCIÓN",
      "COSTO DIARIO",
      "PERIODO",
      "DÍAS",
      "TOTAL",
    ];
    const colWidths = [220, 80, 90, 50, 70];
    const headerHeight = 25;

    doc.rect(leftX, y, contentWidth, headerHeight).fill(yellow);
    doc.font("Helvetica-Bold").fontSize(9).fillColor("black");

    let colX = leftX;
    headers.forEach((h, i) => {
      const align =
        i === 0 ? "left" : i === headers.length - 1 ? "right" : "center";
      doc.text(h, colX + 5, y + 6, { width: colWidths[i] - 10, align });
      colX += colWidths[i];
    });

    // Fila plataforma
    y += headerHeight;
    const rowHeight = 45;
    let rowIndex = 0;

    const drawRow = (rowData: {
      description: string;
      price: number;
      period: string;
      days: number;
      total: number;
    }) => {
      const isStriped = rowIndex % 2 === 1;
      if (isStriped) {
        doc.rect(leftX, y, contentWidth, rowHeight).fill(lightGray);
      } else {
        doc.rect(leftX, y, contentWidth, rowHeight).stroke(gray);
      }

      doc.fillColor("black").font("Helvetica").fontSize(10);
      colX = leftX;
      doc.text(rowData.description, colX + 5, y + 5, {
        width: colWidths[0] - 10,
      });
      doc.text(rowData.price.toFixed(2), colX + colWidths[0] + 5, y + 15, {
        width: colWidths[1] - 10,
        align: "right",
      });
      doc.text(rowData.period, colX + colWidths[0] + colWidths[1] + 5, y + 15, {
        width: colWidths[2] - 10,
        align: "center",
      });
      doc.text(
        `${rowData.days}`,
        colX + colWidths[0] + colWidths[1] + colWidths[2] + 5,
        y + 15,
        {
          width: colWidths[3] - 10,
          align: "center",
        }
      );
      doc.text(
        rowData.total.toFixed(2),
        colX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 5,
        y + 15,
        { width: colWidths[4] - 10, align: "right" }
      );

      y += rowHeight;
      rowIndex++;
    };

    drawRow({
      description: `Marca: ${platform.brand}\nModelo: ${platform.model}\nTipo: ${platform.typePlatform}`,
      price: platform.price,
      period: rentalPeriod,
      days,
      total: platform.price * days,
    });

    if (isNeedOperator) {
      drawRow({
        description: "Operador",
        price: dailyOperatorCost,
        period: rentalPeriod,
        days,
        total: dailyOperatorCost * days,
      });
    }

    // Totales
    y += 15;
    doc.font("Helvetica").fontSize(10);
    doc
      .text("Envío", rightX, y)
      .text(`S/ ${deliveryAmount.toFixed(2)}`, rightX + 80, y, {
        align: "right",
      });
    doc
      .font("Helvetica-Bold")
      .text("Subtotal", rightX, y + 15)
      .text(`S/ ${updatedSubtotal.toFixed(2)}`, rightX + 80, y + 15, {
        align: "right",
      });
    doc
      .font("Helvetica")
      .text("IGV (18%)", rightX, y + 30)
      .text(`S/ ${quotation.igv.toFixed(2)}`, rightX + 80, y + 30, {
        align: "right",
      });

    const totalY = y + 45;
    doc.rect(rightX - 10, totalY - 3, 180, 20).fill(lightGray);
    doc.fillColor("black").font("Helvetica-Bold").text("TOTAL", rightX, totalY);
    doc.text(`S/ ${quotation.total.toFixed(2)}`, rightX + 80, totalY, {
      align: "right",
    });

    // Términos y condiciones
    y = totalY + 50;
    doc.rect(leftX, y, contentWidth, 20).fill(yellow);
    doc
      .fillColor("black")
      .font("Helvetica-Bold")
      .text("TÉRMINOS Y CONDICIONES", leftX + 5, y + 5);

    y += 25;
    doc.font("Helvetica").fontSize(9);
    const terms = [
      "1. Al cliente se le cobrará después de aceptada esta cotización",
      "2. El pago será debitado antes de la entrega de bienes y servicios",
      "3. Por favor enviar la cotización firmada al email indicado anteriormente",
    ];
    terms.forEach((line, i) => {
      doc.text(line, leftX, y + i * 12);
    });

    // Imagen de medios de pago
    y += 60;
    const imageWidth = 500;
    const imageX = (doc.page.width - imageWidth) / 2;
    doc.image("src/assets/medio_pago.png", imageX, y, { width: imageWidth });

    // Añade espacio antes del footer
    y += 160;

    // Línea gris justo encima del texto
    doc
      .moveTo(leftX, y)
      .lineTo(leftX + contentWidth, y)
      .strokeColor("#cccccc")
      .stroke();

    // Texto centrado en la parte inferior
    y += 10;
    doc.fontSize(8).fillColor("gray");
    doc.text(
      "Si usted tiene alguna pregunta sobre esta cotización, por favor, póngase en contacto con nosotros",
      leftX,
      y,
      {
        align: "center",
      }
    );
    doc.text("MANSERCOM S.A.C | ventas@mansercom.pe | +51 949 128 854", {
      align: "center",
    });

    doc.end();

    return new Promise((resolve, reject) => {
      buffer.on("finish", () => resolve(buffer.getContents() as Buffer));
      buffer.on("error", reject);
    });
  }
}
