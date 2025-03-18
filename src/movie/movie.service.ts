import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie-dto';
import { UpdateMovieDto } from './dto/update-movie-dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entitiy/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly moiveRepository: Repository<Movie>,
    @InjectRepository(Movie)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(MovieDetail)
    private readonly moiveDetailRepository: Repository<MovieDetail>,
    @InjectRepository(MovieDetail)
    private readonly directorRepository: Repository<Director>,
  ) { }

  async findAll(title?: string) {
    const movie = await this.moiveRepository.createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');

    if (title) {//title 필터 기능 추가하기
      movie.where('movie.title LIKE :title', { title: `%${title}%` });
    }

    return await movie.getManyAndCount();

    /// 나중에 title 필터 기능 추가하기
    // if (!title) {
    //   return [
    //     await this.moiveRepository.find({
    //       relations: ['director', 'genres'],
    //     }),
    //     await this.moiveRepository.count()
    //   ];
    // }

    // return this.moiveRepository.findAndCount({
    //   where: {
    //     title: Like(`%${title}%`),
    //   },
    //   relations: ['director'],
    // });
  }

  async findOne(id: number) {
    const movie = await this.moiveRepository.createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.detail', 'detail')
      .where('movie.id = :id', { id })
      .getOne();

    // const movie = await this.moiveRepository.findOne({
    //   where: {
    //     id,
    //   },
    //   relations: ['detail', 'director'],
    // });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.')
    }

    // return movie;
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

    const genres = await this.genreRepository.find({
      where: {
        id: In(createMovieDto.genreIds),
      },
    });

    if (genres.length !== createMovieDto.genreIds.length) {
      throw new NotFoundException(`존재하지 않는 장르입니다! 존재하는 IDs => ${genres.map(genre => genre.id).join(',')}`)
    }

    const movieDetail = await this.moiveDetailRepository.createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({ detail: createMovieDto.detail })
      .execute();

    const movieDetailId = movieDetail.identifiers[0].id;

    const movie = await this.moiveRepository.createQueryBuilder()
      .insert()
      .into(Movie)
      .values({
        title: createMovieDto.title,
        detail: {
          detail: movieDetailId,
        },
        director,
      })
      .execute();

    const movieId = movie.identifiers[0].id;

    await this.moiveRepository.createQueryBuilder()
      .relation(Movie, 'genres')
      .of(movieId)
      .add(genres.map(genre => genre.id));

    // const movie = await this.moiveRepository.save({
    //   title: createMovieDto.title,
    //   detail: {
    //     detail: createMovieDto.detail,
    //   },
    //   director,
    //   genres,
    // });
    // 
    // return movie;

    return await this.moiveRepository.findOne({
      where: {
        id: movieId,
      },
      relations: ['detail', 'director', 'genres'],
    });
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const movie = await this.moiveRepository.findOne({
      where: {
        id,
      },
      relations: ['detail', 'genres'],
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.')
    }


    const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

    let newDirector;

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

    let newGeners;

    if (genreIds) {
      const genres = await this.genreRepository.find({
        where: {
          id: In(genreIds),
        },
      });

      if (genres.length !== updateMovieDto.genreIds?.length) {
        throw new NotFoundException(`존재하지 않는 장르입니다! 존재하는 IDs => ${genres.map(genre => genre.id).join(',')}`)
      }

      newGeners = genres;
    }

    const movieUpdateFields = {
      ...movieRest,
      ...(newDirector && { director: newDirector }),
    };


    await this.moiveRepository.createQueryBuilder()
      .update(Movie)
      .set(movieUpdateFields)
      .where('id = :id', { id })
      .execute();

    // await this.moiveRepository.update(
    //   { id },
    //   movieUpdateFields,
    // );

    if (detail) {
      await this.moiveDetailRepository.createQueryBuilder()
        .update(MovieDetail)
        .set({ detail })
        .where('id = :id', { id: movie.detail.id })
        .execute();

      // await this.moiveDetailRepository.update(
      //   { id: movie.detail.id },
      //   { detail },
      // );
    }

    if (newGeners) {
      await this.moiveRepository.createQueryBuilder()
        .relation(Movie, 'genres')
        .of(id)
        .addAndRemove(newGeners.map(genre => genre.id), movie.genres.map(genre => genre.id));
    }

    // const newMovie = await this.moiveRepository.findOne({
    //   where: { id },
    //   relations: ['detail', 'director'],
    // });

    // if (!newMovie) {
    //   throw new NotFoundException('업데이트된 영화를 찾을 수 없습니다.');
    // }

    // newMovie.genres = newGeners;

    // await this.moiveRepository.save(newMovie);

    return this.moiveRepository.findOne({
      where: { id },
      relations: ['detail', 'director', 'genres'],
    });
  }

  async remove(id: number) {
    const movie = await this.moiveRepository.findOne({
      where: { id },
      relations: ['detail']
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.')
    }

    await this.moiveRepository.createQueryBuilder()
      .delete()
      .where('id = :id', { id });

    // await this.moiveRepository.delete(id);
    await this.moiveDetailRepository.delete(movie.detail.id);

    return id;
  }
}
