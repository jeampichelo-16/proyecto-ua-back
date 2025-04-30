import { ApiProperty } from "@nestjs/swagger";
import { UserResponseDto } from "../../users/dto"; // ajusta el path si es necesario
import { MessageResponseDto } from "src/common/dto/message-response.dto";

export class LoginResponseDto extends MessageResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
