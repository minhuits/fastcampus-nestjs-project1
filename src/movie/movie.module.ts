import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { diskStorage } from 'multer';
import { join } from 'path';
import { CommonModule } from 'src/common/common.module';
import { Director } from 'src/director/entitiy/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { v4 } from 'uuid';
import { MovieDetail } from './entity/movie-detail.entity';
import { Movie } from './entity/movie.entity';
import { MovieController } from './movie.controller';
import { MovieService } from './movie.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Movie,
      MovieDetail,
      Director,
      Genre,
    ]),
    CommonModule,
    MulterModule.register({
      storage: diskStorage({
        /// path: .../projectFolder/public/movie
        destination: join(process.cwd(), 'public', 'movie'),
        filename: (request, file, callback) => {
          const split = file.originalname.split('.');

          let extension = 'mp4';

          if (split.length > 1) {
            extension = split[split.length - 1];

          }
          callback(null, `${v4()}_${Date.now()}.${extension}`);
        } // 파일 이름 변경하기
      }),
    }),
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule { }
