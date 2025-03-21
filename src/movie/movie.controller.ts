import { BadRequestException, Body, ClassSerializerInterceptor, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Request, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { CacheInterceptor } from 'src/common/interceptor/cache.interceptor';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { Role } from 'src/user/entities/user.entity';
import { CreateMovieDto } from './dto/create-movie-dto';
import { GetMoviesDto } from './dto/get-moives.dto';
import { UpdateMovieDto } from './dto/update-movie-dto';
import { MovieService } from './movie.service';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) { }
  // 읽기: 전체 가져오기
  @Get()
  @Public()
  @UseInterceptors(CacheInterceptor)
  findAll(
    @Query() dto: GetMoviesDto,
  ) {
    return this.movieService.findAll(dto);
  }

  // 읽기: 1개씩 가져오기
  @Get(':id')
  @Public()
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.movieService.findOne(+id);
  }

  // 생성
  @Post()
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  // @UseInterceptors(FileInterceptor('movie')) // 단일 파일 업로드

  // @UseInterceptors(FilesInterceptor('movies')) // 다중 파일 업로드

  // @UseInterceptors(FileFieldsInterceptor(
  //   [
  //     {
  //       name: 'movie',
  //       maxCount: 1,
  //     },
  //     {
  //       name: 'poster',
  //       maxCount: 2,
  //     },
  //   ],
  //   {
  //     limits: {
  //       fileSize: 2000000, // 파일 크기 제한
  //     },
  //     fileFilter(request, file, callback) {
  //       console.log(file);
  // 
  // 
  //       if (file.mimetype !== 'video/mp4') {
  //         return callback(
  //           new BadRequestException('.mp4 타입만 업로드 가능합니다!'),
  //           false,
  //         );
  //       }
  // 
  //       return callback(null, true);
  //     }
  //   }
  // )) // 다중 파일 업로드

  @UseInterceptors(FileInterceptor('movie', {
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
  create(
    @Body() body: CreateMovieDto,
    @Request() request,
    // @UploadedFile() file: Express.Multer.File // 단일 파일 업로드

    // @UploadedFiles() files: Express.Multer.File[] // 다중 파일 업로드

    // @UploadedFiles() files: {
    //   movie?: Express.Multer.File[],
    //   poster?: Express.Multer.File[],
    // } // 다중 파일 업로드: field 이름이 각기 다른 여러 파일 업로드

    // @UploadedFile(
    //   new MovieFilePipe({
    //     maxSize: 20,
    //     mimetype: 'video/mp4',
    //   }),// 다중 파일 업로드: pipe 활용한 방법
    // ) movie: Express.Multer.File,

    @UploadedFile() movie: Express.Multer.File,
  ) {
    return this.movieService.create(
      body,
      movie.filename,
      request.queryRunner,
    );
  }

  // 수정
  @Patch(':id')
  @RBAC(Role.admin)
  update(
    @Param('id', ParseIntPipe) id: string,
    @Body() body: UpdateMovieDto,
  ) {
    return this.movieService.update(+id, body);
  }

  // 삭제
  @Delete(':id')
  @RBAC(Role.admin)
  remove(@Param('id', ParseIntPipe) id: string) {
    return this.movieService.remove(+id);
  }
}
