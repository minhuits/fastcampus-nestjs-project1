import { CacheKey, CacheTTL, CacheInterceptor as CI } from '@nestjs/cache-manager';
import { Body, ClassSerializerInterceptor, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseInterceptors, Version, VERSION_NEUTRAL } from '@nestjs/common';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { Thrttle } from 'src/common/decorator/thrttle.decorator';
import { CacheInterceptor } from 'src/common/interceptor/cache.interceptor';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { UserId } from 'src/user/decorator/user-id.decorator';
import { Role } from 'src/user/entities/user.entity';
import { QueryRunner as QR } from 'typeorm';
import { CreateMovieDto } from './dto/create-movie-dto';
import { GetMoviesDto } from './dto/get-moives.dto';
import { UpdateMovieDto } from './dto/update-movie-dto';
import { MovieService } from './movie.service';

@Controller({
  path: 'movie',
  version: '2'
})
export class MovieControllerV2 {
  @Get()
  findAll() {
    return [];
  }
}

@Controller({
  path: 'movie',
  // version: ['1', '3'],
  // version: '1',
  version: VERSION_NEUTRAL,
})
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) { }
  // 읽기: 전체 가져오기
  @Get()
  @Public()
  @Thrttle({
    count: 5,
    unit: 'minute',
  })
  @UseInterceptors(CacheInterceptor)
  findAll(
    @Query() dto: GetMoviesDto,
    @UserId() userId?: number,
  ) {
    return this.movieService.findAll(dto, userId);
  }

  @Get('recent')
  @UseInterceptors(CI)
  @CacheKey('getMovieRecent')
  @CacheTTL(3000)
  getMovieRecent() {
    return this.movieService.findRecent();
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

  @Post(':id/like')
  creatMovieLike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, true);
  }

  @Post(':id/dislike')
  creatMovieDislike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, false);
  }
}
