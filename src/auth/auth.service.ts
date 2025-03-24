import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { envVariablesKeys } from 'src/common/const/env.const';
import { Role, User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) { }


  parseBasicToken(rowToken: string) {
    /// 1) 토큰을 ' ' 기준으로 스플릿 한 후 토큰 값만 추출하기
    /// ['Basic', $token]
    const basicSplit = rowToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    const [basic, token] = basicSplit;

    if (basic.toLowerCase() !== 'basic') {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    /// 2) 추출한 토큰을 base64 디코딩해서 이메일과 비밀번호로 나눈다.
    const decoded = Buffer.from(token, 'base64').toString('utf-8');

    /// "email:password"
    /// [email, password]
    const tokenSplit = decoded.split(':');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    const [email, password] = tokenSplit;

    return {
      email,
      password,
    }
  }

  async parseBearerToken(rowToken: string, isRefreshToken: boolean) {
    const basicSplit = rowToken.split(' ');

    if (basicSplit.length !== 2) {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }

    const [bearer, token] = basicSplit;
    if (bearer.toLocaleLowerCase() !== 'bearer') {
      throw new BadRequestException('토큰 포맷이 잘못됐습니다!');
    }


    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>(
          isRefreshToken ? envVariablesKeys.refreshTokenSecret : envVariablesKeys.accessTokenSecret,
        ),
      });

      if (isRefreshToken) {
        if (payload.type !== 'refresh') {
          throw new BadRequestException('REFRESH 토큰을 입력 해주세요!');
        }
      } else {
        if (payload.type !== 'access') {
          throw new BadRequestException('ACCESS 토큰을 입력 해주세요!');
        }
      }

      return payload;
    } catch (e) {
      throw new UnauthorizedException('토큰이 만료됐습니다!');
    }
  }


  async tokenBlock(token: string) {
    const payload = this.jwtService.decode(token);
    const expriryDate = +new Date(payload['exp'] * 1000);
    const now = +Date.now();
    const differenceInSeconds = (expriryDate - now) / 1000;

    await this.cacheManager.set(
      `BLOCK_TOKEN_${token}`,
      payload,
      Math.max(differenceInSeconds * 1000, 1),
    );

    return true;
  }

  /// rowToken -> "Basic $token"
  async register(rowToken: string) {
    const { email, password } = this.parseBasicToken(rowToken);

    return this.userService.create({
      email,
      password,
    });
  }

  async authenticate(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: {
        email,
      }
    });

    if (!user) {
      throw new BadRequestException('잘못된 로그인 정보입니다!');
    }

    const passOk = await bcrypt.compare(password, user.password);

    if (!passOk) {
      throw new BadRequestException('잘못된 로그인 정보입니다!');
    }

    return user;
  }

  async issueToken(user: { id: number, role: Role }, isRefreshToken: boolean) {
    const refreshSecret = this.configService.get<string>(envVariablesKeys.refreshTokenSecret);
    const accessSecret = this.configService.get<string>(envVariablesKeys.accessTokenSecret);

    if (refreshSecret === undefined || accessSecret === undefined) {
      throw new BadRequestException('REFRESH_TOKEN_SECRET 또는 ACCESS_TOKEN_SECRET이 알 수 없는 값(Undefined)입니다!');
    }

    await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
      type: isRefreshToken ? 'refresh' : 'access',
    }, {
      secret: isRefreshToken ? refreshSecret : accessSecret,
      expiresIn: isRefreshToken ? '24h' : 300,
    });
  }

  async login(rowToken: string) {
    const { email, password } = this.parseBasicToken(rowToken);
    const user = await this.authenticate(email, password);

    return {
      refreshToken: await this.issueToken(user, true),
      accessToken: await this.issueToken(user, false),
    }

  }
}
