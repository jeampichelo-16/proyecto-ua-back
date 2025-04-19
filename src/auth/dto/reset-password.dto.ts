import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class ResetPasswordDto {
  @ApiProperty({ example: "nuevoPassword123" })
  @IsString()
  @MinLength(6)
  newPassword: string;

  @ApiProperty({ example: "eyJhbGciOi..." })
  @IsString()
  token: string;
}
