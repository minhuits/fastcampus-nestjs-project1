import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { Model } from 'mongoose';
import { envVariablesKeys } from 'src/common/const/env.const';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schema/user.schema';

@Injectable()
export class UserService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) { }

  async create(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;

    const user = await this.userModel.findOne({ email }).exec();

    if (user) {
      throw new BadRequestException('이미 가입한 이메일 입니다!');
    }

    const hash = await bcrypt.hash(password, this.configService.get<number>(envVariablesKeys.hashRounds) as number);

    // const newUser = new this.userModel({
    //   email,
    //   password: hash,
    // })

    // await newUser.save();

    await this.userModel.create({
      email,
      password: hash,
    });

    return this.userModel.findOne({ email }, {
      createdMovies: 0,
      likedMovies: 0,
      chats: 0,
      chatRooms: 0,
    }).exec();
  }

  findAll() {
    return this.userModel.find().exec();
  }

  async findOne(id: number) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('존재하지 않는 사용입니다!');
    }

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { password } = updateUserDto;

    const user = await this.userModel.findById(id);
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

    await this.userModel.findByIdAndUpdate(id, input).exec();

    return await this.userModel.findById(id);
  }

  async remove(id: number) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('존재하지 않는 사용입니다!');
    }

    await this.userModel.findByIdAndDelete(id);

    return id;
  }
}
