import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 } from 'uuid';
import { CommonController } from './common.controller';
import { CommonService } from './common.service';

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

  ],
  controllers: [CommonController],
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonModule { };