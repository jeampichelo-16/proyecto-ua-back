import { Response } from "express";
import { ConfigService } from "@nestjs/config";

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string }
) {
  const configService = new ConfigService();

  const isProduction = configService.get<string>("NODE_ENV") || "development";

  res.cookie("access_token", tokens.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 15 * 60 * 1000, // 15 minutos
  });

  res.cookie("refresh_token", tokens.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
  });
}

export function clearAuthCookies(res: Response) {
  const configService = new ConfigService();

  const isProduction = configService.get<string>("NODE_ENV") || "development";

  res.clearCookie("access_token", {
    httpOnly: true,
    secure: true,
    sameSite: isProduction ? "none" : "lax",
  });

  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: true,
    sameSite: isProduction ? "none" : "lax",
  });
}
