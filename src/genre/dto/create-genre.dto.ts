import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateGenreDto {
  @IsNotEmpty()
  name: string;
}
