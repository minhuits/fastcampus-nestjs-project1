import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { MovieService } from './movie.service';

@Controller('movie')
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
    @Body('title') title: string,
  ) {
    return this.movieService.createMovie(title);
  }

  // 수정
  @Patch(':id')
  patchMovie(
    @Param('id') id: string,
    @Body('title') title: string,
  ) {
    return this.movieService.updateMovie(+id, title);
  }

  // 삭제
  @Delete(':id')
  deleteMovie(@Param('id') id: string) {
    return this.movieService.deleteMovie(+id);
  }
}
