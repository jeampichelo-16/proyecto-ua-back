import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import chalk from "chalk";

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger("HTTP");

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const userAgent = req.get("user-agent") || "";
    const ip = req.ip;
    const start = Date.now();

    // ✅ Se corrige usando función flecha para mantener el contexto de "this"
    res.on("finish", () => {
      const { statusCode } = res;
      const contentLength = res.get("content-length") ?? "0";
      const duration = Date.now() - start;
      const timestamp = chalk.gray(new Date().toLocaleString());

      const methodColor = this.colorizeMethod(method);
      const statusColor = this.colorizeStatus(statusCode);

      this.logger.log(
        `${methodColor} ${chalk.yellow(
          originalUrl
        )} ${statusColor} - ${contentLength}b - ${chalk.cyan(`${duration}ms`)}`
      );
    });

    next();
  }

  private colorizeMethod(method: string) {
    switch (method.toUpperCase()) {
      case "GET":
        return chalk.green.bold(method);
      case "POST":
        return chalk.blue.bold(method);
      case "PUT":
        return chalk.yellow.bold(method);
      case "DELETE":
        return chalk.red.bold(method);
      case "PATCH":
        return chalk.magenta.bold(method);
      case "OPTIONS":
        return chalk.cyan.bold(method);
      default:
        return chalk.white(method);
    }
  }

  private colorizeStatus(status: number) {
    if (status >= 500) return chalk.bgRed.white(` ${status} `);
    if (status >= 400) return chalk.red(status);
    if (status >= 300) return chalk.yellow(status);
    if (status >= 200) return chalk.blue(status);
    if (status >= 100) return chalk.cyan(status);
    if (status === 0) return chalk.gray(status);
    return chalk.green(status);
  }
}
