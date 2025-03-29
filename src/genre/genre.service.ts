import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { Genre } from './schema/genre.schema';

@Injectable()
export class GenreService {
  constructor(
    @InjectModel(Genre.name)
    private readonly genreModel: Model<Genre>,
  ) { }

  async create(createGenreDto: CreateGenreDto) {
    // const result = await this.genreModel.create(createGenreDto);

    // return {
    //   ...result.toObject(),
    //   _id: result._id.toString(),
    // };

    // return result.toObject({
    //   transform: (model, ret)=> {
    //     ret._id = ret._id.toString();
    //     return ret;
    //   }
    // })

    return this.genreModel.create(createGenreDto);
  }

  findAll() {
    return this.genreModel.find().exec();
  }

  async findOne(id: string) {
    const genre = await this.genreModel.findById(id).exec();

    if (!genre) {
      throw new NotFoundException('존재하지 않는 장르입니다.');

    }

    return genre;
  }

  async update(id: string, updateGenreDto: UpdateGenreDto) {
    const genre = await this.genreModel.findById(id).exec();

    if (!genre) {
      throw new NotFoundException('존재하지 않는 장르입니다.');

    }

    await this.genreModel.findByIdAndUpdate(id, updateGenreDto).exec();

    const newGenre = await this.genreModel.findById(id).exec();

    return newGenre;
  }

  async remove(id: string) {
    const genre = await this.genreModel.findById(id);

    if (!genre) {
      throw new NotFoundException('존재하지 않는 장르입니다.');

    }

    await this.genreModel.findByIdAndDelete(id);

    return id;
  }
}
