import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiBasicAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { User } from '../users/user.entity';
import { AuthRequestDto, AuthResponseDto } from './dto/login.dto';

@ApiBasicAuth()
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({
    status: 200,
    description: 'JWT access token',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async login(@Body() loginDto: AuthRequestDto) {
    const user = await this.authService.validateUser(loginDto.username, loginDto.password);

    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }

    return this.authService.login(user);
  }
}
