import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateGenreDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}
