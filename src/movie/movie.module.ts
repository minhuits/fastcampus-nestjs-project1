import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from 'src/common/common.module';
import { Director, DirectorSchema } from 'src/director/schema/director.schema';
import { Genre, GenreSchema } from 'src/genre/schema/genre.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';
import { MovieDetail, MovieDetailSchema } from './schema/movie-detail.schema';
import { MovieUserLike, MovieUserLikeSchema } from './schema/movie-user-like.schema';
import { Movie, MovieSchema } from './schema/movie.schema';

@Module({
  imports: [
    // TypeOrmModule.forFeature([
    //   Movie,
    //   MovieDetail,
    //   MovieUserLike,
    //   Director,
    //   Genre,
    //   User,
    // ]),

    MongooseModule.forFeature([
      {
        name: Movie.name,
        schema: MovieSchema
      },

      {
        name: MovieDetail.name,
        schema: MovieDetailSchema,
      },
      {
        name: MovieUserLike.name,
        schema: MovieUserLikeSchema,
      },
      {
        name: Director.name,
        schema: DirectorSchema,
      },
      {
        name: Genre.name,
        schema: GenreSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    CommonModule,
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule { }
