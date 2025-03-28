import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { envVariablesKeys } from 'src/common/const/env.const';
import { PrismaService } from 'src/common/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) { }

  async create(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      }
    });

    if (user) {
      throw new BadRequestException('이미 가입한 이메일 입니다!');
    }

    const hash = await bcrypt.hash(password, this.configService.get<number>(envVariablesKeys.hashRounds) as number);

    await this.prisma.user.create({
      data: {
        email,
        password: hash,
      }
    });

    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      }
    });

    if (!user) {
      throw new NotFoundException('존재하지 않는 사용입니다!');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { password } = updateUserDto;

    const user = await this.prisma.user.findUnique({
      where: {
        id,
      }
    });

    const hashRounds = this.configService.get<number>(envVariablesKeys.hashRounds) as number;

    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자입니다!');
    }

    let input: Prisma.UserUpdateInput = {
      ...updateUserDto,
    };

    if (password) {
      const hash = await bcrypt.hash(password, hashRounds);

      input = {
        ...input,
        password: hash,
      }
    }


    await this.prisma.user.update({
      where: {
        id
      },
      data: input,
    });

    return await this.prisma.user.findUnique({
      where: {
        id,
      }
    });
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      }
    });

    if (!user) {
      throw new NotFoundException('존재하지 않는 사용입니다!');
    }

    await this.prisma.user.delete({
      where: {
        id
      }
    });

    return id;
  }
}
