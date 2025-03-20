import { Body, ClassSerializerInterceptor, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseInterceptors } from '@nestjs/common';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entities/user.entity';
import { CreateMovieDto } from './dto/create-movie-dto';
import { UpdateMovieDto } from './dto/update-movie-dto';
import { MovieService } from './movie.service';
import { MovieTitleValidationPipe } from './pipe/movie-title-validation.pipe';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) { }
  // 읽기: 전체 가져오기
  @Get()
  @Public()
  findAll(
    @Query('title', MovieTitleValidationPipe) title?: string,
  ) {
    return this.movieService.findAll(title);
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
  create(
    @Body() body: CreateMovieDto
  ) {
    return this.movieService.create(body);
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
