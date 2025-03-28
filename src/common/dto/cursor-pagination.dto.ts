import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsArray, IsInt, IsOptional, IsString } from "class-validator";

export class CursorPaginationDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: '커서',
    example: 'eyJpZCI6MSwibmFtZSI6Im1vdmllcyJ9',
  })
  cursor?: string;

  @IsArray()
  @IsString({
    each: true,
  })
  @IsOptional()
  @ApiProperty({
    description: '내림차순 OR 오름차순 정렬 순서',
    example: ['id_ASC'],
  })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  order: string[] = ['id_DESC'];

  @IsInt()
  @IsOptional()
  @ApiProperty({
    description: '가져올 데이터의 개수',
    example: 5,
  })
  take: number = 2;
}