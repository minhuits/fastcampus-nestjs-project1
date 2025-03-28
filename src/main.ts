import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['verbose'],
  });

  const config = new DocumentBuilder()
    .setTitle('넷플릭스 API')
    .setDescription('코드팩토리 넷플릭스 API 문서')
    .setVersion('1.0')
    .addBasicAuth()
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    }
  }));

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
