import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import { Director } from './schema/director.schema';

@Injectable()
export class DirectorService {
  constructor(
    @InjectModel(Director.name)
    private readonly directorModel: Model<Director>,
  ) { }

  create(createDirectorDto: CreateDirectorDto) {
    return this.directorModel.create(createDirectorDto);
  }

  findAll() {
    return this.directorModel.find();
  }

  findOne(id: string) {
    return this.directorModel.findById(id);
  }

  async update(id: string, updateDirectorDto: UpdateDirectorDto) {
    const director = await this.directorModel.findById(id);

    if (!director) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.')
    }

    await this.directorModel.findByIdAndUpdate(id, updateDirectorDto).exec();

    const newDirector = await this.directorModel.findById(id);

    // const newDirector = await this.prisma.director.findUnique({
    //   where: {
    //     id
    //   },
    // });

    return newDirector;
  }

  async remove(id: string) {
    const director = await this.directorModel.findById(id);

    if (!director) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.')
    }

    await this.directorModel.findByIdAndDelete(id);

    return id;
  }
}
