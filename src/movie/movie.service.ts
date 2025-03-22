import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { rename } from 'fs/promises';
import { join } from 'path';
import { CommonService } from 'src/common/common.service';
import { Director } from 'src/director/entitiy/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { User } from 'src/user/entities/user.entity';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie-dto';
import { GetMoviesDto } from './dto/get-moives.dto';
import { UpdateMovieDto } from './dto/update-movie-dto';
import { MovieDetail } from './entity/movie-detail.entity';
import { MovieUserLike } from './entity/movie-user-like';
import { Movie } from './entity/movie.entity';

@Injectable()
export class MovieService {
  constructor(
    @InjectRepository(Movie)
    private readonly moiveRepository: Repository<Movie>,
    @InjectRepository(MovieUserLike)
    private readonly moiveUserLikeRepository: Repository<MovieUserLike>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MovieDetail)
    private readonly moiveDetailRepository: Repository<MovieDetail>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
  ) { }

  async findAll(dto: GetMoviesDto, userId?: number) {
    const { title } = dto;

    const queryBuilder = await this.moiveRepository.createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres');


    if (title) {
      queryBuilder.where('movie.title LIKE :title', { title: `%${title}%` });
    }

    const { nextCursor } = await this.commonService.applyCursorPagination(queryBuilder, dto);

    let [data, count] = await queryBuilder.getManyAndCount();

    if (userId) {
      const movieIds = data.map(movie => movie.id);

      const likedMovies = movieIds.length < 1 ? [] : await this.moiveUserLikeRepository.createQueryBuilder('moiveUserLike')
        .leftJoinAndSelect('moiveUserLike.user', 'user')
        .leftJoinAndSelect('moiveUserLike.user', 'moive')
        .where('movie.id IN(:...movieIds', { movieIds })
        .andWhere('user.id = :userId', { userId })
        .getMany();

      const likedMovieMap = likedMovies.reduce((acc, next) => ({
        ...acc,
        [next.movie.id]: next.isLike,
      }));

      // state: null || true || false
      data = data.map((movie) => ({
        ...movie,
        likeStatus: movie.id in likedMovieMap ? likedMovieMap[movie.id] : null,
      }));
    }
    return {
      data,
      nextCursor,
      count,
    }
  }

  async findOne(id: number) {
    const movie = await this.moiveRepository.createQueryBuilder('movie')
      .leftJoinAndSelect('movie.director', 'director')
      .leftJoinAndSelect('movie.genres', 'genres')
      .leftJoinAndSelect('movie.detail', 'detail')
      .leftJoinAndSelect('movie.creator', 'creator')
      .where('movie.id = :id', { id })
      .getOne();

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.')
    }

    return movie;
  }

  async create(createMovieDto: CreateMovieDto, userId: number, queryRunner: QueryRunner) {
    const director = await queryRunner.manager.findOne(Director, {
      where: {
        id: createMovieDto.directorId,
      },
    });

    if (!director) {
      throw new NotFoundException('존재하지 않는 ID의 감독입니다!')
    }

    const genres = await queryRunner.manager.find(Genre, {
      where: {
        id: In(createMovieDto.genreIds),
      },
    });

    if (genres.length !== createMovieDto.genreIds.length) {
      throw new NotFoundException(`존재하지 않는 장르입니다! 존재하는 IDs => ${genres.map(genre => genre.id).join(',')}`)
    }

    const movieDetail = await queryRunner.manager.createQueryBuilder()
      .insert()
      .into(MovieDetail)
      .values({ detail: createMovieDto.detail })
      .execute();

    const movieDetailId = movieDetail.identifiers[0].id;
    const movieFolder = join('public', 'movie');
    const tempFolder = join('public', 'temp');

    const movie = await queryRunner.manager.createQueryBuilder()
      .insert()
      .into(Movie)
      .values({
        title: createMovieDto.title,
        detail: {
          detail: movieDetailId,
        },
        director,
        creator: {
          id: movieDetailId,
        },
        movieFilePath: join(movieFolder, createMovieDto.movieFileName),
      })
      .execute();

    const movieId = movie.identifiers[0].id;

    await queryRunner.manager.createQueryBuilder()
      .relation(Movie, 'genres')
      .of(movieId)
      .add(genres.map(genre => genre.id));

    await rename(
      join(process.cwd(), tempFolder, createMovieDto.movieFileName),
      join(process.cwd(), movieFolder, createMovieDto.movieFileName),
    );

    return await queryRunner.manager.findOne(Movie, {
      where: {
        id: movieId,
      },
      relations: ['detail', 'director', 'genres'],
    });
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const query = this.dataSource.createQueryRunner();
    await query.connect();
    await query.startTransaction();

    try {
      const movie = await query.manager.findOne(Movie, {
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
        const director = await query.manager.findOne(Director, {
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
        const genres = await query.manager.find(Genre, {
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


      await query.manager.createQueryBuilder()
        .update(Movie)
        .set(movieUpdateFields)
        .where('id = :id', { id })
        .execute();

      if (detail) {
        await query.manager.createQueryBuilder()
          .update(MovieDetail)
          .set({ detail })
          .where('id = :id', { id: movie.detail.id })
          .execute();
      }

      if (newGeners) {
        await query.manager.createQueryBuilder()
          .relation(Movie, 'genres')
          .of(id)
          .addAndRemove(newGeners.map(genre => genre.id), movie.genres.map(genre => genre.id));
      }

      await query.commitTransaction();

      return this.moiveRepository.findOne({
        where: { id },
        relations: ['detail', 'director', 'genres'],
      });
    } catch (error) {
      await query.rollbackTransaction();
      throw error;
    } finally {
      await query.release();
    }
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

    await this.moiveDetailRepository.delete(movie.detail.id);

    return id;
  }

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    const movie = await this.moiveRepository.findOne({
      where: {
        id: userId,
      }
    });

    if (!movie) {
      throw new BadRequestException('존재하지 않는 영화입니다!');
    }

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      }
    });

    if (!user) {
      throw new UnauthorizedException('사용자 정보가 없습니다!');
    }

    const likeRocord = await this.moiveUserLikeRepository.createQueryBuilder('moiveUserLike')
      .leftJoinAndSelect('moiveUserLike.moive', 'moive')
      .leftJoinAndSelect('moiveUserLike.user', 'user')
      .where('moive.id = :movieId', { moiveId: movieId })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    if (likeRocord) {
      if (isLike === likeRocord.isLike) {
        await this.moiveUserLikeRepository.delete({
          movie,
          user,
        });
      } else {
        await this.moiveUserLikeRepository.update(
          { movie, user, },
          { isLike }
        );
      }
    } else {
      await this.moiveUserLikeRepository.save({
        movie,
        user,
        isLike,
      })
    }

    const result = await this.moiveUserLikeRepository.createQueryBuilder('moiveUserLike')
      .leftJoinAndSelect('moiveUserLike.moive', 'moive')
      .leftJoinAndSelect('moiveUserLike.user', 'user')
      .where('moive.id = :movieId', { moiveId: movieId })
      .andWhere('user.id = :userId', { userId })
      .getOne();

    return {
      isLike: result && result.isLike,
    };
  }
}
