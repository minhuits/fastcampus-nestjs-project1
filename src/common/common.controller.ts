import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Queue } from 'bullmq';
import { CommonService } from './common.service';

@Controller('common')
@ApiBearerAuth()
@ApiTags('common')
export class CommonController {
  constructor(
    private readonly commonService: CommonService,
    @InjectQueue('thumbnail-generation')
    private readonly thumbnailQueue: Queue,
  ) { }

  @Post('video')
  @UseInterceptors(FileInterceptor('video', {
    limits: {
      fileSize: 2000000, // 파일 크기 제한
    },
    fileFilter(request, file, callback) {
      console.log(file);

      if (file.mimetype !== 'video/mp4') {
        return callback(
          new BadRequestException('.mp4 타입만 업로드 가능합니다!'),
          false,
        );
      }

      return callback(null, true);
    }
  }))

  async createVideo(
    @UploadedFile() movie: Express.Multer.File,
  ) {
    await this.thumbnailQueue.add('thumbnail', {
      videoId: movie.filename,
      videoPath: movie.path,
    }, {
      priority: 1,
      delay: 100,
      attempts: 3,
      lifo: true,
    });

    return {
      fileName: movie.filename,
    };
  }

  @Post('presigned-url')
  async createPresignedUrl() {
    return {
      url: await this.commonService.createPresignedUrl(),
    };
  }
}
