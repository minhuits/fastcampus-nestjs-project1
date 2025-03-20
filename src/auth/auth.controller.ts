import { Controller, Get, Headers, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './strategy/jwt.strategy';
import { LocalAuthGuard } from './strategy/local.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  /// authorization: Basic $token
  registerUser(@Headers('authorization') token: string) {
    return this.authService.register(token);
  }

  @Post('login')
  /// authorization: Basic $token
  loginUser(@Headers('authorization') token: string) {
    return this.authService.login(token);
  }

  @Post('token/access')
  /// authorization: Basic $token
  async rotateAccessToken(@Headers('authorization') token: string) {
    const payload = await this.authService.parseBearerToken(token, true);
    
    return {
      accessToken: await this.authService.issueToken(payload, false),
    }
  }

  @UseGuards(LocalAuthGuard)
  @Post('login/passport')
  async loginUserPassport(@Request() request) {
    return {
      refreshToken: await this.authService.issueToken(request.user, true),
      accessToken: await this.authService.issueToken(request.user, false),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('private')
  async private(@Request() requset) {
    return requset.user;
  }
}