import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager";
import { BadRequestException, Inject, Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { NextFunction, Request, Response } from "express";
import { envVariablesKeys } from "src/common/const/env.const";

@Injectable()
export class BearerTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) { }

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      next();
      return;
    }

    const refreshType = 'refresh';
    const accessType = 'access';

    const token = this.validateBearerToken(authHeader);
    const decodedPayload = this.jwtService.decode(token);

    const tokenKey = `TOKEN_${token}`;
    const blockToken = await this.cacheManager.get(`BLOCK_TOKEN_${token}`);
    const cachedPayload = await this.cacheManager.get(tokenKey);

    if (blockToken) {
      throw new UnauthorizedException('차단된 토큰입니다!');
    }

    if (cachedPayload) {
      req.user = cachedPayload;

      return next();
    }
    if (decodedPayload.type !== refreshType && decodedPayload.type !== accessType) {
      throw new UnauthorizedException('잘못된 토큰입니다!');
    }

    try {
      const secretKey = decodedPayload.type === refreshType ?
        envVariablesKeys.refreshTokenSecret :
        envVariablesKeys.accessTokenSecret;

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(
          secretKey,
        ),
      });

      const expriryDate = +new Date(payload['exp'] * 1000);
      const now = +Date.now();
      const differenceInSeconds = (expriryDate - now) / 1000;

      await this.cacheManager.set(
        tokenKey,
        payload,
        Math.max((differenceInSeconds - 30) * 1000, 1),
      );

      req.user = payload;
      next();
    } catch (e) {
      if (e.name === 'TokenExpiredError') {
        throw new UnauthorizedException('토큰이 만료됐습니다');
      }
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