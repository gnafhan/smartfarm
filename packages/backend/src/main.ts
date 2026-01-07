import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { useContainer } from 'class-validator';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable class-validator to use NestJS dependency injection
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: configService.get<string>('frontendUrl'),
    credentials: true,
  });

  const port = configService.get<number>('port') ?? 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
void bootstrap();
