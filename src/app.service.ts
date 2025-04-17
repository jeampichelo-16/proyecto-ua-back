import { Injectable } from "@nestjs/common";
import { version } from "../package.json";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getStatus() {
    return {
      status: "ok",
      uptime: process.uptime(), // tiempo que lleva corriendo el servidor
      timestamp: new Date().toISOString(),
      env: this.configService.get("NODE_ENV"),
      version: version || "1.0.0",
    };
  }
}
