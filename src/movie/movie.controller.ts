import { Body, ClassSerializerInterceptor, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseInterceptors } from '@nestjs/common';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { CacheInterceptor } from 'src/common/interceptor/cache.interceptor';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { UserId } from 'src/user/decorator/user-id.decorator';
import { Role } from 'src/user/entities/user.entity';
import { QueryRunner as QR } from 'typeorm';
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
  create(
    @Body() body: CreateMovieDto,
    @QueryRunner() queryRunner: QR,
    @UserId() userId: number,
  ) {
    return this.movieService.create(
      body,
      userId,
      queryRunner,
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
