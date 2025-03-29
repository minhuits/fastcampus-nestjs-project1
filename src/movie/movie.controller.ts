import { CacheKey, CacheTTL, CacheInterceptor as CI } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Thrttle } from 'src/common/decorator/thrttle.decorator';
import { CacheInterceptor } from 'src/common/interceptor/cache.interceptor';
import { UserId } from 'src/user/decorator/user-id.decorator';
import { CreateMovieDto } from './dto/create-movie-dto';
import { GetMoviesDto } from './dto/get-moives.dto';
import { UpdateMovieDto } from './dto/update-movie-dto';
import { MovieService } from './movie.service';

@Controller('movie')
@ApiBearerAuth()
@ApiTags('movie')
// @UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) { }
  // 읽기: 전체 가져오기
  @Get()
  @Public()
  @Thrttle({
    count: 5,
    unit: 'minute',
  })
  @ApiOperation({
    description: '[Movie]를 Pagenation을 하는 API',
  })
  @ApiResponse({
    status: 200,
    description: '성공적으로 API Pagenation을 실행 했을 때',
  })
  @ApiResponse({
    status: 400,
    description: 'Pagenation 데이터를 잘못 입력 했을 때',
  })
  @UseInterceptors(CacheInterceptor)
  findAll(
    @Query() dto: GetMoviesDto,
    @UserId() userId?:string,
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
    @Param('id') id: string,
    @Req() request: any
  ) {
    const session = request.session;

    const movieCount = session.moiveCount ?? {};

    request.session.movieCount = {
      ...movieCount,
      [id]: movieCount[id] ? movieCount[id] + 1 : 1,
    }

    return this.movieService.findOne(id);
  }

  // 생성
  @Post()
  @RBAC(Role.admin)
  create(
    @Body() body: CreateMovieDto,
    @UserId() userId: string,
  ) {
    return this.movieService.create(
      body,
      userId,
    );
  }

  // 수정
  @Patch(':id')
  @RBAC(Role.admin)
  update(
    @Param('id') id: string,
    @Body() body: UpdateMovieDto,
  ) {
    return this.movieService.update(id, body);
  }

  // 삭제
  @Delete(':id')
  @RBAC(Role.admin)
  remove(@Param('id') id: string) {
    return this.movieService.remove(id);
  }

  @Post(':id/like')
  creatMovieLike(
    @Param('id') movieId: string,
    @UserId() userId: string,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, true);
  }

  @Post(':id/dislike')
  creatMovieDislike(
    @Param('id') movieId: string,
    @UserId() userId: string,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, false);
  }
}
