import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose'],
  });
  app.enableVersioning({
    // 1. URI versioning
    // type: VersioningType.URI,
    // defaultVersion: ['1', '2'],
 
    // 2. Header versioning
    // type: VersioningType.HEADER,
    // header: 'version',

    // 3. Media Type versioning
    type: VersioningType.MEDIA_TYPE,
    key: 'v=',
  });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    }
  }));
  await app.listen(3000);
}
bootstrap();
