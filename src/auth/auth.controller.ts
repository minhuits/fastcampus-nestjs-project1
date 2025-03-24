import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBasicAuth, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Authorization } from './decorator/authorization.decorator';
import { Public } from './decorator/public.decorator';
// import { JwtAuthGuard } from './strategy/jwt.strategy';
import { LocalAuthGuard } from './strategy/local.strategy';

@Controller('auth')
@ApiBearerAuth()
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @ApiBasicAuth()
  @Post('register')
  registerUser(@Authorization() token: string) {
    return this.authService.register(token);
  }

  @Public()
  @ApiBasicAuth()
  @Post('login')
  loginUser(@Authorization() token: string) {
    return this.authService.login(token);
  }

  @Post('token/access')
  async rotateAccessToken(@Request() request){
    return {
      accessToken: await this.authService.issueToken(request.user, false),
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

  // @UseGuards(JwtAuthGuard)
  // @Get('private')
  // async private(@Request() requset) {
  //   return requset.user;
  // }
}