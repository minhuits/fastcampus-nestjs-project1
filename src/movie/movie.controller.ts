import { Controller, Request, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, ClassSerializerInterceptor, ParseIntPipe, BadRequestException, DefaultValuePipe, NotFoundException } from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie-dto';
import { UpdateMovieDto } from './dto/update-movie-dto';
import { MovieTitleValidationPipe } from './pipe/movie-title-validation.pipe';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) { }
  // 읽기: 전체 가져오기
  @Get()
  findAll(
    @Request() request: any,
    @Query('title', MovieTitleValidationPipe) title?: string,
  ) {
    console.log(request.user);
    /// title 쿼리의 타입이 string 타입인지?
    return this.movieService.findAll(title);
  }

  // 읽기: 1개씩 가져오기
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.movieService.findOne(+id);
  }

  // 생성
  @Post()
  create(
    @Body() body: CreateMovieDto
  ) {
    return this.movieService.create(body);
  }

  // 수정
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: string,
    @Body() body: UpdateMovieDto,
  ) {
    return this.movieService.update(+id, body);
  }

  // 삭제
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: string) {
    return this.movieService.remove(+id);
  }
}
