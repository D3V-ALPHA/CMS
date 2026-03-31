import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { runMigrations } from './database/migrate'; // adjust path if necessary

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for development (allow all origins)
  // For production, restrict to your frontend domain (e.g., 'https://your-frontend.com')
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Run database migrations before starting the server
  await runMigrations();

  await app.listen(3000);
}
void bootstrap();
