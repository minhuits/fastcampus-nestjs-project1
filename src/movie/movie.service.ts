import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie-dto';
import { UpdateMovieDto } from './dto/update-movie-dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entitiy/director.entity';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly moiveRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly moiveDetailRepository: Repository<MovieDetail>,
    @InjectRepository(MovieDetail)
    private readonly directorRepository: Repository<Director>,
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
    const director = await this.directorRepository.findOne({
      where: {
        id: createMovieDto.directorId,
      },
    });

    if (!director) {
      throw new NotFoundException('존재하지 않는 ID의 감독입니다!')
    }

    const movie = await this.moiveRepository.save({
      title: createMovieDto.title,
      genre: createMovieDto.genre,
      detail: {
        detail: createMovieDto.detail,
      },
      director,
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

    let newDirector;
    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.')
    }

    const { detail, directorId, ...movieRest } = updateMovieDto;

    if (directorId) {
      const director = await this.directorRepository.findOne({
        where: {
          id: directorId,
        },
      });

      if (!director) {
        throw new NotFoundException('존재하지 않는 ID 값의 감독입니다.');
      }

      newDirector = director;
    }

    const movieUpdateFields = {
      ...movieRest,
      ...(newDirector && { director: newDirector }),
    };

    this.moiveRepository.update(
      { id },
      movieUpdateFields,
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
      relations: ['detail', 'director'],
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
