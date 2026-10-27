import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { criarOpcoesCors } from './config/cors.config.js';
import { criarHandler } from './vercel.handler.js';

async function criarApp() {
  // Na Vercel, o erro precisa chegar ao handler em vez de o Nest encerrar o processo
  const app = await NestFactory.create(AppModule, {
    abortOnError: !process.env.VERCEL,
  });

  app.enableCors(criarOpcoesCors(process.env.FRONTEND_URL));
  app.useGlobalPipes(new ValidationPipe());

  return app;
}

// VERCEL: chama esta função a cada requisição
export default criarHandler(criarApp);

// COMPUTADOR: sobe o servidor normalmente (na Vercel a variável VERCEL existe)
async function bootstrap() {
  const app = await criarApp();
  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}

if (!process.env.VERCEL) {
  bootstrap();
}