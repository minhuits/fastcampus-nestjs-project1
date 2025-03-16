import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie-dto';
import { UpdateMovieDto } from './dto/update-movie-dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly moiveRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly moiveDetailRepository: Repository<MovieDetail>,
  ) { }

  async findAll(title?: string) {
    /// 나중에 title 필터 기능 추가하기
    if (!title) {
      return [
        await this.moiveRepository.find({
          relations: ['detail'],
        }),
        await this.moiveRepository.count()
      ];
    }

    return this.moiveRepository.findAndCount({
      where: {
        title: Like(`%${title}%`),
      },
      relations: ['detail'],
    });
  }

  async findOne(id: number) {
    const movie = await this.moiveRepository.findOne({
      where: {
        id,
      },
      relations: ['detail'],
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.')
    }

    return movie;
  }

  async create(createMovieDto: CreateMovieDto) {
    const movieDetail = await this.moiveDetailRepository.save({
      detail: createMovieDto.detail,
    });

    const movie = await this.moiveRepository.save({
      title: createMovieDto.title,
      genre: createMovieDto.genre,
      detail: movieDetail,
    });

    return movie;
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const movie = await this.moiveRepository.findOne({
      where: {
        id,
      },
      relations: ['detail'],
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.')
    }

    const { detail, ...movieRest } = updateMovieDto;

    this.moiveRepository.update(
      { id },
      movieRest,
    );

    if (detail) {
      await this.moiveDetailRepository.update(
        { id: movie.detail.id },
        { detail },
      );
    }

    const newMovie = await this.moiveRepository.findOne({
      where: {
        id,
      },
      relations: ['detail'],
    });

    return newMovie;
  }

  async remove(id: number) {
    const movie = await this.moiveRepository.findOne({
      where: {
        id,
      },
      relations: ['detail']
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.')
    }

    await this.moiveRepository.delete(id);
    await this.moiveDetailRepository.delete(movie.detail.id);

    return id;
  }
}
