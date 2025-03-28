import { CacheModule } from '@nestjs/cache-manager';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConditionalModule, ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as schema from 'joi';
import { WinstonModule } from 'nest-winston';
import { join } from 'path';
import * as winston from 'winston';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/guard/auth.guard';
import { RBACGuard } from './auth/guard/rbac.guard';
import { BearerTokenMiddleware } from './auth/middleware/beare-token.middleware';
import { ChatModule } from './chat/chat.module';
import { ChatRoom } from './chat/entity/chat-room.entity';
import { Chat } from './chat/entity/chat.entity';
import { envVariablesKeys } from './common/const/env.const';
import { QueryFailedExceptionsFilter } from './common/filter/exception.filter';
import { ResponseTimeInterceptor } from './common/interceptor/response-time.interceptor';
import { ThrottleInterceptor } from './common/interceptor/throttle.interceptor';
import { DirectorModule } from './director/director.module';
import { Director } from './director/entitiy/director.entity';
import { Genre } from './genre/entity/genre.entity';
import { GenreModule } from './genre/genre.module';
import { MovieDetail } from './movie/entity/movie-detail.entity';
import { MovieUserLike } from './movie/entity/movie-user-like.entity';
import { Movie } from './movie/entity/movie.entity';
import { MovieModule } from './movie/movie.module';
import { User } from './user/entity/user.entity';
import { UserModule } from './user/user.module';
import { WrokModule } from './worker/worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? 'test.env' : '.env',
      validationSchema: schema.object({
        ENV: schema.string().valid('test', 'dev', 'prod').required(),
        DB_TYPE: schema.string().valid('postgres').required(),
        DB_HOST: schema.string().required(),
        DB_PORT: schema.number().required(),
        DB_USERNAME: schema.string().required(),
        DB_PASSWORD: schema.string().required(),
        DB_DATABASE: schema.string().required(),
        DB_URL: schema.string().required(),
        HASH_ROUNDS: schema.number().required(),
        ACCESS_TOKEN_SECRET: schema.string().required(),
        REFRESH_TOKEN_SECRET: schema.string().required(),
        AWS_SECRET_ACCESS_KEY: schema.string().required(),
        AWS_ACCESS_KEY_ID: schema.string().required(),
        AWS_REGION: schema.string().required(),
        BUCKET_NAME: schema.string().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: configService.get<string>(envVariablesKeys.dbType) as "postgres",
        url: configService.get<string>(envVariablesKeys.dbUrl),
        // host: configService.get<string>(envVariablesKeys.dbHost),
        // port: configService.get<number>(envVariablesKeys.dbPort),
        // username: configService.get<string>(envVariablesKeys.dbUserName),
        // password: configService.get<string>(envVariablesKeys.dbPassword),
        // database: configService.get<string>(envVariablesKeys.dbDatabase),
        entities: [
          Movie,
          MovieDetail,
          MovieUserLike,
          Director,
          Genre,
          User,
          Chat,
          ChatRoom,
        ],
        synchronize: configService.get<string>(envVariablesKeys.env) === 'prod' ? false : true,
        ...(configService.get<string>(envVariablesKeys.env) === 'prod' && {
          ssl: {
            rejectUnauthorized: false,
          }
        })
      }),
      inject: [ConfigService]
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/public/',
    }),
    CacheModule.register({
      ttl: 0,
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    WinstonModule.forRoot({
      level: 'debug',
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({
              all: true,
            }),
            winston.format.timestamp(),
            winston.format.printf(info => `${info.timestamp} ${info.context} ${info.level} ${info.message}`),
          ),
        }),
        new winston.transports.File({
          dirname: join(process.cwd(), 'logs'),
          filename: 'logs.log',
          format: winston.format.combine(
            winston.format.colorize({
              all: true,
            }),
            winston.format.timestamp(),
            winston.format.printf(info => `${info.timestamp} ${info.context} ${info.level} ${info.message}`),
          ),
        })
      ]
    }),
    MovieModule,
    DirectorModule,
    GenreModule,
    AuthModule,
    UserModule,
    ChatModule,
    ConditionalModule.registerWhen(
      WrokModule,
      (env: NodeJS.ProcessEnv) => env['TYPE'] === 'worker',
    ),
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RBACGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTimeInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ThrottleInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: QueryFailedExceptionsFilter,
    },
  ],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(
      BearerTokenMiddleware,
    ).exclude(
      {
        path: 'auth/login',
        method: RequestMethod.POST,
        // version: ['1', '2'] 
      },
      {
        path: 'auth/register',
        method: RequestMethod.POST,
        // version: ['1', '2'] 
      },
    ).forRoutes('*');
  }
}