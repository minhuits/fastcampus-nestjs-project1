import { Body, Controller, Get, Headers, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorator/public.decorator';
import { JwtAuthGuard } from './strategy/jwt.strategy';
import { LocalAuthGuard } from './strategy/local.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('register')
  registerUser(@Headers('authorization') token: string) {
    return this.authService.register(token);
  }

  @Public()
  @Post('login')
  loginUser(@Headers('authorization') token: string) {
    return this.authService.login(token);
  }

  @Post('token/access')
  async rotateAccessToken(@Request() request) {
    const payload = await this.authService.parseBearerToken(request.user, true);

    return {
      accessToken: await this.authService.issueToken(payload, false),
    }
  }

  @Post('token/block')
  blockToken(
    @Body('token') token: string,
  ) {
    return this.authService.tokenBlock(token);
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