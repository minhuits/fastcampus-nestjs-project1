import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { diskStorage } from 'multer';
import { join } from 'path';
import { Movie } from 'src/movie/entity/movie.entity';
import { v4 } from 'uuid';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';
import { DefaultLogger } from './loggler/default.logger';
import { TaskService } from './task.service';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        /// path: .../projectFolder/public/movie
        destination: join(process.cwd(), 'public', 'temp'),
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
    TypeOrmModule.forFeature([
      Movie,
    ]),
    
    BullModule.forRoot({
      connection: {
        host: 'redis-15796.c340.ap-northeast-2-1.ec2.redns.redis-cloud.com',
        port: 15796,
        username: 'default',
        password: '', 
      }
    }),
    BullModule.registerQueue({
      name: 'thumbnail-generation',
    }),
  ],
  controllers: [CommonController],
  providers: [CommonService, TaskService, DefaultLogger],
  exports: [CommonService, DefaultLogger],
})
export class CommonModule { };