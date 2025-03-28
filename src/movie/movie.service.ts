import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { rename } from 'fs/promises';
import { join } from 'path';
import { CommonService } from 'src/common/common.service';
import { envVariablesKeys } from 'src/common/const/env.const';
import { PrismaService } from 'src/common/prisma.service';
import { Director } from 'src/director/entitiy/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { DataSource, QueryRunner } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie-dto';
import { GetMoviesDto } from './dto/get-moives.dto';
import { UpdateMovieDto } from './dto/update-movie-dto';
import { Movie } from './entity/movie.entity';

@Injectable()
export class MovieService {
  constructor(
    // @InjectRepository(Movie)
    // private readonly movieRepository: Repository<Movie>,
    // @InjectRepository(MovieDetail)
    // private readonly movieDetailRepository: Repository<MovieDetail>,
    // @InjectRepository(Director)
    // private readonly directorRepository: Repository<Director>,
    // @InjectRepository(Genre)
    // private readonly genreRepository: Repository<Genre>,
    // @InjectRepository(User)
    // private readonly userRepository: Repository<User>,
    // @InjectRepository(MovieUserLike)
    // private readonly movieUserLikeRepository: Repository<MovieUserLike>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) { }
  async findRecent() {
    const cacheData = await this.cacheManager.get('MOVIE_RECENT');

    if (cacheData) {
      return cacheData;
    }

    const data = await this.prisma.movie.findMany({
      orderBy: {
        createdAt: 'desc',
      }
    });

    await this.cacheManager.set('MOVIE_RECENT', data);

    return data;
  }

  /* istanbul ignore next */
  async getMovies() {
    // return this.movieRepository.createQueryBuilder('movie')
    //   .leftJoinAndSelect('movie.director', 'director')
    //   .leftJoinAndSelect('movie.genres', 'genres');
  }

  /* istanbul ignore next */
  async getLikedMovies(movieIds: number[], userId: number) {
    // return this.movieUserLikeRepository.createQueryBuilder('mul')
    //   .leftJoinAndSelect('mul.user', 'user')
    //   .leftJoinAndSelect('mul.movie', 'movie')
    //   .where('movie.id IN(:...movieIds)', { movieIds })
    //   .andWhere('user.id = :userId', { userId })
    //   .getMany()
  }


  async findAll(dto: GetMoviesDto, userId?: number) {
    const { title, cursor, take, order } = dto;

    const orderBy = order.map((field) => {
      const [column, direction] = field.split('_');
      return { [column]: direction.toLocaleLowerCase() }
    });

    const movies = await this.prisma.movie.findMany({
      where: title ? { title: { contains: title } } : {},
      take: take + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: parseInt(cursor) } : undefined,
      orderBy,
      include: {
        genres: true,
        director: true,
      }
    })

    const hasNextPage = movies.length > take;
    if (hasNextPage) movies.pop();

    const nextCursor = hasNextPage ? movies[movies.length - 1].id.toString() : null;

    if (userId) {
      const movieIds = movies.map((movie) => movie.id);

      const likedMovies = movieIds.length < 1 ? [] : await this.prisma.movieUserLike.findMany({
        where: {
          movieId: { in: movieIds },
          userId: userId,
        },
        include: {
          movie: true,
        }
      })

      const likedMovieMap = likedMovies.reduce((acc, next) => ({
        ...acc,
        [next.movie.id]: next.isLike,
      }), {});

      return {
        data: movies.map((movie) => ({
          ...movie,
          likeCount: movie.id in likedMovieMap ? likedMovieMap[movie.id] : null,
        })),
        nextCursor,
        hasNextPage,
      }
    }

    return {
      movies,
      nextCursor,
      hasNextPage,
    }
  }

  /* istanbul ignore next */
  async findMovieDetail(id: number) {
    // return this.movieRepository.createQueryBuilder('movie')
    //   .leftJoinAndSelect('movie.director', 'director')
    //   .leftJoinAndSelect('movie.genres', 'genres')
    //   .leftJoinAndSelect('movie.detail', 'detail')
    //   .leftJoinAndSelect('movie.creator', 'creator')
    //   .where('movie.id = :id', { id })
    //   .getOne();
  }

  async findOne(id: number) {
    const movie = await this.prisma.movie.findUnique({
      where: {
        id,
      }
    });
    // const movie = await this.findMovieDetail(id);

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다!');
    }

    return movie;
  }

  /* istanbul ignore next */
  async createMovieDetail(queryRunner: QueryRunner, createMovieDto: CreateMovieDto) {
    // return queryRunner.manager.createQueryBuilder()
    //   .insert()
    //   .into(MovieDetail)
    //   .values({ detail: createMovieDto.detail })
    //   .execute()
  }
  /* istanbul ignore next */
  createMovie(
    queryRunner: QueryRunner,
    createMovieDto: CreateMovieDto,
    director: Director,
    movieDetailId: number,
    userId: number,
    movieFolder: string,
  ) {
    // return queryRunner.manager.createQueryBuilder()
    //   .insert()
    //   .into(Movie)
    //   .values({
    //     title: createMovieDto.title,
    //     detail: {
    //       id: movieDetailId,
    //     },
    //     director,
    //     creator: {
    //       id: userId,
    //     },
    //     movieFilePath: join(movieFolder, createMovieDto.movieFileName),
    //   })
    //   .execute()
  }

  /* istanbul ignore next */
  createMovieGenreRelation(queryRunner: QueryRunner, movieId: number, genres: Genre[]) {
    // return queryRunner.manager.createQueryBuilder()
    //   .relation(Movie, 'genres')
    //   .of(movieId)
    //   .add(genres.map(genre => genre.id));
  }

  /* istanbul ignore next */
  createRenameMovieFile(tempFolder: string, movieFolder: string, createMovieDto: CreateMovieDto) {
    if (this.configService.get<string>(envVariablesKeys.env) !== 'prod') {
      return rename(
        join(process.cwd(), tempFolder, createMovieDto.movieFileName),
        join(process.cwd(), movieFolder, createMovieDto.movieFileName),
      );
    } else {
      return this.commonService.saveMovieToPermanentStorage(createMovieDto.movieFileName);
    }
  }

  /* istanbul ignore next */
  async create(createMovieDto: CreateMovieDto, userId: number) {
    return this.prisma.$transaction(async (prisma) => {
      const director = await prisma.director.findUnique({
        where: {
          id: createMovieDto.directorId,
        },
      });

      if (!director) {
        throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
      }

      const genres = await prisma.genre.findMany({
        where: {
          id: {
            in: createMovieDto.genreIds,
          },
        },
      });

      if (genres.length !== createMovieDto.genreIds.length) {
        throw new NotFoundException(`존재하지 않는 장르가 있습니다! 존재하는 ids -> ${genres.map(genre => genre.id).join(',')}`);
      }

      const movieDetail = await prisma.movieDetall.create({
        data: {
          detail: createMovieDto.detail,
        }
      });

      const movie = await prisma.movie.create({
        data: {
          title: createMovieDto.title,
          movieFilePath: createMovieDto.movieFileName,
          creator: { connect: { id: userId } },
          director: { connect: { id: director.id } },
          genres: { connect: genres.map((genre) => ({ id: genre.id })) },
          detail: { connect: { id: movieDetail.id } }
        }
      });

      return prisma.movie.findUnique({
        where: {
          id: movie.id,
        },
        include: {
          detail: true,
          director: true,
          genres: true,
        }
      });
    });
  }

  /* istanbul ignore next */
  updateMovie(queryRunner: QueryRunner, movieUpdateFields: UpdateMovieDto, id: number) {
    // return queryRunner.manager.createQueryBuilder()
    //   .update(Movie)
    //   .set(movieUpdateFields)
    //   .where('id = :id', { id })
    //   .execute();
  }

  /* istanbul ignore next */
  updateMovieDetail(queryRunner: QueryRunner, detail: string, movie: Movie) {
    // return queryRunner.manager.createQueryBuilder()
    //   .update(MovieDetail)
    //   .set({
    //     detail,
    //   })
    //   .where('id = :id', { id: movie.detail.id })
    //   .execute();
  }

  /* istanbul ignore next */
  updateMovieGenreRelation(queryRunner: QueryRunner, id: number, newGenres: Genre[], movie: Movie) {
    // return queryRunner.manager.createQueryBuilder()
    //   .relation(Movie, 'genres')
    //   .of(id)
    //   .addAndRemove(newGenres.map(genre => genre.id), movie.genres.map(genre => genre.id));
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    return this.prisma.$transaction(async (prisma) => {
      const movie = await prisma.movie.findUnique({
        where: { id },
        include: {
          detail: true,
          genres: true,
        }
      });

      if (!movie) {
        throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.')
      }

      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

      let moiveUpdateParams: Prisma.MovieUpdateInput = {
        ...movieRest,
      }


      if (directorId) {
        const director = await prisma.director.findUnique({
          where: {
            id: directorId,
          },
        });

        if (!director) {
          throw new NotFoundException('존재하지 않는 ID 값의 감독입니다.');
        }

        moiveUpdateParams.director = {
          connect: {
            id: directorId,
          }
        };
      }

      if (genreIds) {
        const genres = await prisma.genre.findMany({
          where: {
            id: {
              in: genreIds,
            },
          },
        });

        if (genres.length !== updateMovieDto.genreIds?.length) {
          throw new NotFoundException(`존재하지 않는 장르입니다! 존재하는 IDs => ${genres.map(genre => genre.id).join(',')}`)
        }

        moiveUpdateParams.genres = {
          set: genres.map((genre) => ({ id: genre.id })),
        };
      }

      await prisma.movie.update({
        where: { id },
        data: moiveUpdateParams,
      })

      if (detail) {
        await prisma.movieDetall.update({
          where: {
            id: movie.detail.id,
          },
          data: { detail }
        });
      }

      return prisma.movie.findUnique({
        where: { id },
        include: {
          detail: true,
          director: true,
          genres: true,
        }
      })
    });
  }

  /* istanbul ignore next */
  deleteMovie(id: number) {
    // return this.movieRepository.createQueryBuilder()
    //   .delete()
    //   .where('id = :id', { id })
    //   .execute();
  }

  async remove(id: number) {
    // const movie = await this.movieRepository.findOne({
    const movie = await this.prisma.movie.findUnique({
      where: {
        id,
      },
      include: {
        detail: true,
      }
    });

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다!');
    }

    // await this.deleteMovie(id);

    await this.prisma.movie.delete({
      where: {
        id,
      }
    })

    // await this.movieDetailRepository.delete(movie.detail.id);
    await this.prisma.movie.delete({
      where: {
        id: movie.detail.id
      }
    });

    return id;
  }

  /* istanbul ignore next */
  getLikedRecord(movieId: number, userId: number) {
    // return this.movieUserLikeRepository.createQueryBuilder('mul')
    //   .leftJoinAndSelect('mul.movie', 'movie')
    //   .leftJoinAndSelect('mul.user', 'user')
    //   .where('movie.id = :movieId', { movieId })
    //   .andWhere('user.id = :userId', { userId })
    //   .getOne();
  }

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean) {
    const movie = await this.prisma.movie.findUnique({
      where: {
        id: userId,
      }
    });

    if (!movie) {
      throw new BadRequestException('존재하지 않는 영화입니다!');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      }
    });

    if (!user) {
      throw new UnauthorizedException('사용자 정보가 없습니다!');
    }

    const likeRocord = await this.prisma.movieUserLike.findUnique({
      where: {
        movieId_userId: {
          movieId,
          userId,
        }
      }
    });

    if (likeRocord) {
      if (isLike === likeRocord.isLike) {
        await this.prisma.movieUserLike.delete({
          where: {
            movieId_userId: { movieId, userId }
          }
        })
      } else {
        await this.prisma.movieUserLike.update({
          where: {
            movieId_userId: { movieId, userId }
          },
          data: {
            isLike,
          }
        });
      }
    } else {
      await this.prisma.movieUserLike.create({
        data: {
          movie: { connect: { id: movieId } },
          user: { connect: { id: userId } },
          isLike,
        }
      });
    }

    const result = await this.prisma.movieUserLike.findUnique({
      where: {
        movieId_userId: {
          movieId,
          userId,
        }
      }
    });

    return {
      isLike: result && result.isLike,
    };
  }
}
