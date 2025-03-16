import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie-dto';
import { UpdateMovieDto } from './dto/update-movie-dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie) private readonly moiveRepository: Repository<Movie>
  ) { }

  async getManyMovies(title?: string) {
    /// 나중에 title 필터 기능 추가하기
    if (!title) {
      return [
        await this.moiveRepository.find(),
        await this.moiveRepository.count()
      ];
    }

    return this.moiveRepository.findAndCount({
      where: {
        title: Like(`%${title}%`),
      }
    });
  }

  async getMovieById(id: number) {
    // const movie = this.movies.find((m) => m.id == +id);
    const movie = await this.moiveRepository.findOne({ where: { id } });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.')
    }

    return movie;
  }

  async createMovie(createMovieDto: CreateMovieDto) {
    const movie = await this.moiveRepository.save(createMovieDto);

    return movie;
  }

  async updateMovie(id: number, updateMovieDto: UpdateMovieDto) {
    const movie = await this.moiveRepository.findOne({
      where: {
        id,
      }
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.')
    }

    this.moiveRepository.update({ id }, updateMovieDto);

    const newMovie = await this.moiveRepository.findOne({
      where: {
        id,
      }
    });

    return newMovie;
  }

  async deleteMovie(id: number) {
    const movie = await this.moiveRepository.findOne({
      where: {
        id,
      }
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.')
    }

    await this.moiveRepository.delete(id);

    return id;
  }
}
