import { JwtPayload, verify, decode } from "jsonwebtoken";
import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export function validateRefreshToken(
  token: string,
  configService: ConfigService
): JwtPayload {
  try {
    // 1. Decodificar token sin verificar aún
    const decoded = decode(token) as JwtPayload;

    if (!decoded || !decoded.exp) {
      throw new UnauthorizedException("El refresh token está mal formado");
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);
    if (decoded.exp < nowInSeconds) {
      throw new UnauthorizedException("El refresh token ha expirado");
    }

    // 2. Obtener secreto
    const secret = configService.get<string>("JWT_REFRESH_SECRET");
    if (!secret) {
      throw new UnauthorizedException(
        "No se encontró el secreto JWT_REFRESH_SECRET"
      );
    }

    // 3. Verificar firma
    return verify(token, secret) as JwtPayload;
  } catch (error) {
    throw new UnauthorizedException("Refresh token inválido");
  }
}
