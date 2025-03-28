import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { User } from 'src/user/entity/user.entity';
import { UserModule } from 'src/user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategy/local.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
    ]),
    JwtModule.register({}),
    UserModule,
    CommonModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy],
  exports: [AuthService, JwtModule]
})
export class AuthModule { }
