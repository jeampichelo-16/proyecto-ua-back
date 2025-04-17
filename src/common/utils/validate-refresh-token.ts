import { JwtPayload, verify, decode } from "jsonwebtoken";
import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export function validateRefreshToken(
  token: string,
  configService: ConfigService
): JwtPayload {
  const decoded = decode(token) as JwtPayload;

  if (!decoded || !decoded.exp) {
    throw new UnauthorizedException("Malformed refresh token");
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (decoded.exp < nowInSeconds) {
    throw new UnauthorizedException("Refresh token expired");
  }

  try {
    const secret = configService.get<string>("JWT_REFRESH_SECRET");
    if (!secret) {
      throw new UnauthorizedException("JWT_REFRESH_SECRET is not defined");
    }
    return verify(token, secret) as JwtPayload;
  } catch {
    throw new UnauthorizedException("Invalid refresh token");
  }
}
