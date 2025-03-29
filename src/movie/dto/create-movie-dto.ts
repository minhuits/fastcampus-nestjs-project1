import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString } from "class-validator";

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '영화 제목',
    example: '겨율왕국',
  })
  title: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '영화 설명',
    example: '엘사와 안나의 이야기',
  })
  detail: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: '감독 객체 ID',
    example: 1,
  })
  directorId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @Type(() => String)
  @ApiProperty({
    description: '장르 객체 IDs',
    example: [1, 2, 3],
  })
  genreIds: string[];

  @IsString()
  @ApiProperty({
    description: '영화 파일 이름',
    example: 'aaa-bbb-ccc-ddd.jpg',
  })
  movieFileName: string;
}