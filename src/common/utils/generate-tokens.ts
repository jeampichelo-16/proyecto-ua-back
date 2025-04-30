import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { JwtPayload } from "../types/jwt-payload";
import { TokensResponseDto } from "../dto/tokens-response.dto";
import { handleServiceError } from "./handle-error.util";

export function generateTokens(
  jwt: JwtService,
  config: ConfigService,
  payload: JwtPayload
): TokensResponseDto {
  try {
    const accessToken = jwt.sign(payload, {
      secret: config.get<string>("JWT_ACCESS_SECRET"),
      expiresIn: config.get<string>("TIMEOUT_ACCESS_TOKEN"),
    });

    const refreshToken = jwt.sign(payload, {
      secret: config.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: config.get<string>("TIMEOUT_REFRESH_TOKEN"),
    });

    return { accessToken, refreshToken };
  } catch (error) {
    handleServiceError(error, "Error al generar los tokens");
  }
}
