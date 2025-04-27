// src/utils/parseExpiration.ts

export function parseExpiration(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
  
    if (!match) {
      throw new Error("Formato de expiración inválido. Usa '15m', '1h', '7d', etc.");
    }
  
    const value = parseInt(match[1], 10);
    const unit = match[2];
  
    switch (unit) {
      case 's': return value * 1000;           // segundos
      case 'm': return value * 60 * 1000;       // minutos
      case 'h': return value * 60 * 60 * 1000;   // horas
      case 'd': return value * 24 * 60 * 60 * 1000; // días
      default:
        throw new Error("Unidad de expiración no soportada");
    }
  }
  