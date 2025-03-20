import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthGuard, PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

export class JwtAuthGuard extends AuthGuard('jwt') { }

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
  ) {
    const secret = configService.get<string>('ACCESS_TOKEN_SECRET');
    if (!secret) {
      throw new BadRequestException('ACCESS_TOKEN_SECRET 환경 변수가 설정되지 않았습니다.');
    }

    super({
      /// Bearer $token
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }
  validate(payload: any) {
    return payload;
  }
}