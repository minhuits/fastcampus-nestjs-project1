import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as schema from 'joi';
import { AuthModule } from './auth/auth.module';
import { DirectorModule } from './director/director.module';
import { Director } from './director/entitiy/director.entity';
import { Genre } from './genre/entities/genre.entity';
import { GenreModule } from './genre/genre.module';
import { MovieDetail } from './movie/entity/movie-detail.entity';
import { Movie } from './movie/entity/movie.entity';
import { MovieModule } from './movie/movie.module';
import { User } from './user/entities/user.entity';
import { UserModule } from './user/user.module';
import { envVariablesKeys } from './common/const/env.const';

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
        HASH_ROUNDS: schema.number().required(),
        ACCESS_TOKEN_SECRET: schema.string().required(),
        REFRESH_TOKEN_SECRET: schema.string().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>(envVariablesKeys.dbType) as "postgres",
        host: configService.get<string>(envVariablesKeys.dbHost),
        port: configService.get<number>(envVariablesKeys.dbPort),
        username: configService.get<string>(envVariablesKeys.dbUserName),
        password: configService.get<string>(envVariablesKeys.dbPassword),
        database: configService.get<string>(envVariablesKeys.dbDatabase),
        entities: [
          Movie,
          MovieDetail,
          Director,
          Genre,
          User,
        ],
        synchronize: true,
      }),

      inject: [ConfigService]
    }),

    MovieModule,

    DirectorModule,

    GenreModule,

    AuthModule,

    UserModule
  ],
})

export class AppModule { }