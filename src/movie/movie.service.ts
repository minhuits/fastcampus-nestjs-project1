import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { rename } from 'fs/promises';
import { Model, Types } from 'mongoose';
import { join } from 'path';
import { CommonService } from 'src/common/common.service';
import { envVariablesKeys } from 'src/common/const/env.const';
import { Director } from 'src/director/schema/director.schema';
import { Genre } from 'src/genre/schema/genre.schema';
import { User } from 'src/user/schema/user.schema';
import { DataSource, QueryRunner } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie-dto';
import { GetMoviesDto } from './dto/get-moives.dto';
import { UpdateMovieDto } from './dto/update-movie-dto';
import { MovieDetail } from './schema/movie-detail.schema';
import { MovieUserLike } from './schema/movie-user-like.schema';
import { Movie } from './schema/movie.schema';

type MoiveUpdateParamsTypes = {
  title?: string,
  moiveUpdateParams?: string,
  director?: Types.ObjectId,
  genres?: Types.ObjectId[],
};

@Injectable()
export class MovieService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
    @InjectModel(Movie.name)
    private readonly movieModel: Model<Movie>,
    @InjectModel(MovieDetail.name)
    private readonly movieDetailModel: Model<Movie>,
    @InjectModel(MovieUserLike.name)
    private readonly movieUserLikeModel: Model<MovieUserLike>,
    @InjectModel(Director.name)
    private readonly directorModel: Model<Director>,
    @InjectModel(Genre.name)
    private readonly genreModel: Model<Genre>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) { }
  async findRecent() {
    const cacheData = await this.cacheManager.get('MOVIE_RECENT');

    if (cacheData) {
      return cacheData;
    }

    const data = await this.movieModel.find()
      .populate({
        path: 'genres',
        model: 'Genre',
      })
      .sort({ createAt: -1 })
      .limit(10)
      .exec();

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

  async findAll(dto: GetMoviesDto, userId?: string) {
    const { title, cursor, take, order } = dto;

    const orderBy = order.reduce((acc, field) => {
      const [column, direction] = field.split('_');
      if (column === 'id') {
        acc['_id'] = direction.toLowerCase();
      } else {
        acc[column] = direction.toLowerCase();
      }
      return acc;
    }, {})

    const query = this.movieModel
      .find(title ? {
        title: {
          $regex: title,
        },
        $option: 'i'
      } : {})
      .sort(orderBy)
      .limit(take + 1);

    if (cursor) {
      query.lt('_id', new Types.ObjectId(cursor));
    }

    const movies = await query.populate('genres director').exec();

    const hasNextPage = movies.length > take;

    if (hasNextPage) movies.pop();

    const nextCursor = hasNextPage ? (movies[movies.length - 1]._id as Types.ObjectId).toString() : null;

    if (userId) {
      const movieIds = movies.map((movie) => movie._id);

      const likedMovies = movieIds.length < 1 ? [] : await this.movieUserLikeModel.find({
        movie: { $in: movieIds.map((id) => new Types.ObjectId(id?.toString())) },
        user: new Types.ObjectId(userId),
      })
        .populate('movie')
        .exec();

      /**
       * {
       *  movieId: boolean
       * }
       */
      const likedMovieMap = likedMovies.reduce((acc, next) => ({
        ...acc,
        [(next.movie._id as Movie).toString()]: next.isLike,
      }), {});

      return {
        data: movies.map((movie) => ({
          ...movie.toObject(),
          likeStatus: (movie._id as Movie).toString() in likedMovieMap ? likedMovieMap[(movie._id as Movie).toString()] : null,
        })) as any,
        nextCursor,
        hasNextPage,
      }
    }

    return {
      data: movies,
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

  async findOne(id: string) {
    const movie = await this.movieModel.findById(id);

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
  async create(createMovieDto: CreateMovieDto, userId: string) {
    const session = await this.movieModel.startSession();
    session.startTransaction();

    try {
      const director = await this.directorModel.findById(createMovieDto.directorId).exec();

      if (!director) {
        throw new NotFoundException('존재하지 않는 ID의 감독입니다!');
      }
      const genres = await this.genreModel.find({
        _id: {
          in: createMovieDto.genreIds,
        },
      }).exec();

      if (genres.length !== createMovieDto.genreIds.length) {
        throw new NotFoundException(`존재하지 않는 장르가 있습니다! 존재하는 ids -> ${genres.map(genre => genre.id).join(',')}`);
      }
      const movieDetail = await this.movieDetailModel.create(
        [
          {
            detail: createMovieDto.detail,
          },
          {
            session,
          }
        ],
      );

      const movie = await this.movieModel.create(
        [
          {
            title: createMovieDto.title,
            movieFilePath: createMovieDto.movieFileName,
            creator: userId,
            director: director.id,
            genres: genres.map((genre) => ({ id: genre.id })),
            detail: movieDetail[0]._id,
          },
          {
            session,
          }
        ]
      );

      await session.commitTransaction();

      return this.movieModel.findById(movie[0]._id)
        .populate('detail')
        .populate('director')
        .populate({
          path: 'genres',
          model: 'Genre',
        })
        .exec();
    } catch (e) {
      await session.abortTransaction();
      console.log(e);
      throw new InternalServerErrorException('트랜잭션 실패!');
    } finally {
      session.endSession();
    }
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


  async update(id: string, updateMovieDto: UpdateMovieDto) {
    const session = await this.movieModel.startSession();
    session.startTransaction();

    try {
      const movie = await this.movieModel.findById(id)
        .populate('detail')
        .populate({
          path: 'genres',
          model: 'Genre',
        })
        .exec();

      if (!movie) {
        throw new NotFoundException('존재하지 않는 ID 값의 영화입니다.')
      }

      const { detail, directorId, genreIds, ...movieRest } = updateMovieDto;

      let moiveUpdateParams: MoiveUpdateParamsTypes = { ...movieRest }

      if (directorId) {
        const director = await this.directorModel.findById(directorId).exec();

        if (!director) {
          throw new NotFoundException('존재하지 않는 ID 값의 감독입니다.');
        }

        moiveUpdateParams.director = director._id as Types.ObjectId;

      }

      if (genreIds) {
        const genres = await this.genreModel.find({
          _id: {
            in: genreIds,
          },
        }).exec();

        if (genres.length !== updateMovieDto.genreIds?.length) {
          throw new NotFoundException(`존재하지 않는 장르입니다! 존재하는 IDs => ${genres.map(genre => genre.id).join(',')}`)
        }
        moiveUpdateParams.genres = genres.map((genre) => genre.id) as Types.ObjectId[];
      }

      if (detail) {
        await this.movieDetailModel.findByIdAndUpdate(movie.detail._id, { detail }).exec();
      }

      await this.movieModel.findByIdAndUpdate(id, moiveUpdateParams);

      await session.commitTransaction();

      return this.movieModel.findById(id).populate('detail director genres').exec();
    } catch (e) {
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
  }

  /* istanbul ignore next */
  deleteMovie(id: number) {
    // return this.movieRepository.createQueryBuilder()
    //   .delete()
    //   .where('id = :id', { id })
    //   .execute();
  }

  async remove(id: string) {
    const movie = await this.movieModel.findById(id).populate('detail').exec();

    if (!movie) {
      throw new NotFoundException('존재하지 않는 ID의 영화입니다!');
    }

    await this.movieModel.findByIdAndDelete(id).exec();

    await this.movieDetailModel.findByIdAndDelete(movie.detail._id).exec();

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

  async toggleMovieLike(movieId: string, userId: string, isLike: boolean) {
    const movie = await this.movieModel.findById(movieId).exec();

    if (!movie) {
      throw new BadRequestException('존재하지 않는 영화입니다!');
    }

    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new UnauthorizedException('사용자 정보가 없습니다!');
    }

    const likeRecord = await this.movieUserLikeModel.findOne({
      movie: new Types.ObjectId(movieId),
      user: new Types.ObjectId(userId),
    })

    if (likeRecord) {
      if (isLike === likeRecord.isLike) {
        await this.movieUserLikeModel.findByIdAndDelete(likeRecord._id);
      } else {
        likeRecord.isLike = isLike;
        likeRecord.save();
      }
    } else {
      await this.movieUserLikeModel.create({
        movie: new Types.ObjectId(movieId),
        user: new Types.ObjectId(userId),
        isLike,
      })
    }

    const result = await this.movieUserLikeModel.findOne({
      movie: new Types.ObjectId(movieId),
      user: new Types.ObjectId(userId),
    });

    return {
      isLike: result && result.isLike,
    }
  }
}

