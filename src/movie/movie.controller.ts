import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie-dto';
import { UpdateMovieDto } from './dto/update-movie-dto';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) { }
  // 읽기: 전체 가져오기
  @Get()
  getMovies(
    @Query('title') title?: string,
  ) {
    /// title 쿼리의 타입이 string 타입인지?
    return this.movieService.getManyMovies(title);
  }

  // 읽기: 1개씩 가져오기
  @Get(':id')
  getMovie(@Param('id') id: string) {
    return this.movieService.getMovieById(+id);
  }

  // 생성
  @Post()
  postMovie(
    @Body() body: CreateMovieDto
  ) {
    return this.movieService.createMovie(body);
  }

  // 생성
  @Post()
  postSeries(
    @Body() body: CreateMovieDto
  ) {
    return this.movieService.createSeries(body);
  }

  // 수정
  @Patch(':id')
  patchMovie(
    @Param('id') id: string,
    @Body() body: UpdateMovieDto,
  ) {
    return this.movieService.updateMovie(+id, body);
  }

  // 삭제
  @Delete(':id')
  deleteMovie(@Param('id') id: string) {
    return this.movieService.deleteMovie(+id);
  }
}
