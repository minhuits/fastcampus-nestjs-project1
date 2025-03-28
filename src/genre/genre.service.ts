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
    return this.genreModel.create(createGenreDto);

  }

  findAll() {
    return this.genreModel.find().exec();
  }

  async findOne(id: number) {
    const genre = await this.genreModel.findById(id).exec();

    if (!genre) {
      throw new NotFoundException('존재하지 않는 장르입니다.');

    }

    return genre;
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {
    const genre = await this.genreModel.findById(id).exec();

    if (!genre) {
      throw new NotFoundException('존재하지 않는 장르입니다.');

    }

    await this.genreModel.findByIdAndUpdate(id, updateGenreDto).exec();

    const newGenre = await this.genreModel.findById(id).exec();

    return newGenre;
  }

  async remove(id: number) {
    const genre = await this.genreModel.findById(id);

    if (!genre) {
      throw new NotFoundException('존재하지 않는 장르입니다.');

    }

    await this.genreModel.findByIdAndDelete(id);

    return id;
  }
}
