import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Permite conexões do frontend Angular (http://localhost:4200)
  app.enableCors();

  // Ativa as regras de validação dos DTOs (class-validator)
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();











//import { NestFactory } from '@nestjs/core';



//import { AppModule } from './app.module.js';

//async function bootstrap() {
  //const app = await NestFactory.create(AppModule);
  //await app.listen(process.env.PORT ?? 3000);
//}
//await bootstrap();
