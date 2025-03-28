import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { Genre } from './entity/genre.entity';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Genre]),
    CommonModule,
  ],
  controllers: [GenreController],
  providers: [GenreService],
})
export class GenreModule { }
