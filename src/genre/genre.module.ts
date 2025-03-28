import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
// import { Genre } from './entity/genre.entity';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Genre, GenreSchema } from './schema/genre.schema';

@Module({
  imports: [
    // TypeOrmModule.forFeature([Genre]),
    MongooseModule.forFeature([  
      {
        name: Genre.name,
        schema: GenreSchema,
      }
    ]),
    CommonModule,
  ],
  controllers: [GenreController],
  providers: [GenreService],
})
export class GenreModule { }
