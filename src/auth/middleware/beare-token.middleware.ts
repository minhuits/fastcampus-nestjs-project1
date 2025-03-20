import { BadRequestException, Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { NextFunction, Request, Response } from "express";
import { envVariablesKeys } from "src/common/const/env.const";

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      next();
      return;
    }

    const refreshType = 'refresh';
    const accessType = 'access';
    
    try {
      const token = this.validateBearerToken(authHeader);
      const decodedPayload = this.jwtService.decode(token);

      if (decodedPayload.type !== refreshType && decodedPayload.type !== accessType) {
        throw new UnauthorizedException('잘못된 토큰입니다!');
      }


      const secretKey = decodedPayload.type === refreshType ?
        envVariablesKeys.refreshTokenSecret :
        envVariablesKeys.accessTokenSecret;

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(secretKey),
      });

      req.user = payload;
      next();
    } catch (e) {
      next();
    }
  }

  validateBearerToken(rowToken: string) {
    const basicSplit = rowToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    const [bearer, token] = basicSplit;

    if (bearer.toLocaleLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    return token;
  }
}