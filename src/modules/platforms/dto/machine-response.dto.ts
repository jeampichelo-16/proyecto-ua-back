import { ApiProperty } from '@nestjs/swagger';
import { PlatformType } from 'src/common/enum/platform-type.enum';
import { PlatformStatus } from 'src/common/enum/platform-status.enum';

export class MachineResponseDto {
  @ApiProperty({ example: 'CAT', description: 'Marca de la maquinaria' })
  brand: string;

  @ApiProperty({ example: 'AutoCat 3000', description: 'Modelo de la maquinaria' })
  model: string;

  @ApiProperty({ enum: PlatformType, example: PlatformType.ELECTRICO })
  typePlatform: PlatformType;

  @ApiProperty({ example: 1200.5, description: 'Precio de la maquinaria' })
  price: number;

  @ApiProperty({ enum: PlatformStatus, example: PlatformStatus.ACTIVO })
  status: PlatformStatus;

  @ApiProperty({ example: 'Maquinaria para uso en interiores', required: false })
  description: string | null;

  @ApiProperty({ example: 'https://storage.googleapis.com/.../operatividad-certificado.pdf' })
  operativityCertificatePath: string;

  @ApiProperty({ example: 'https://storage.googleapis.com/.../documento-propiedad.pdf' })
  ownershipDocumentPath: string;
}
