import { Module } from '@nestjs/common';
import { MovieModule } from './movie/movie.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as schema from 'joi';
import { Movie } from './movie/entity/movie.entity';
import { MovieDetail } from './movie/entity/movie-detail.entity';
import { DirectorModule } from './director/director.module';
import { Director } from './director/entitiy/director.entity';
import { GenreModule } from './genre/genre.module';
import { Genre } from './genre/entities/genre.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: schema.object({
        ENV: schema.string().valid('dev', 'prod').required(),
        DB_TYPE: schema.string().valid('postgres').required(),
        DB_HOST: schema.string().required(),
        DB_PORT: schema.number().required(),
        DB_USERNAME: schema.string().required(),
        DB_PASSWORD: schema.string().required(),
        DB_DATABASE: schema.string().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>('DB_TYPE') as "postgres",
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [
          Movie,
          MovieDetail,
          Director,
          Genre,
        ],
        synchronize: true,
      }),

      inject: [ConfigService]
    }),

    MovieModule,

    DirectorModule,

    GenreModule
  ],
})

export class AppModule { }