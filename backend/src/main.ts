import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { criarOpcoesCors } from './config/cors.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Permite conexões do frontend Angular. Em produção, defina FRONTEND_URL com o
  // endereço do site (veja backend/.env.example); sem ela, qualquer origem é aceita.
  app.enableCors(criarOpcoesCors(process.env.FRONTEND_URL));

  // Ativa as regras de validação dos DTOs (class-validator)
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}

bootstrap();











