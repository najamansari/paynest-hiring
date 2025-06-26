import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AuthRequestDto {
  @ApiProperty({ example: 'user1', description: 'Username' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'password1', description: 'Password' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIyIiwic3ViIjoyLCJpYXQiOjE3NTA5NTk4MTMsImV4cCI6MTc1MDk2MzQxM30.GiJrWy0OS5eyyFP7FCzChi3HF7WyA7S-zhBw7dHr6U8',
    description: 'JWT token',
  })
  @IsString()
  @IsNotEmpty()
  access_token: string;
}
