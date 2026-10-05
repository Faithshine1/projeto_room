import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AgendamentosController } from './agendamentos/agendamentos.controller.js';
import { AgendamentosModule } from './agendamentos/agendamentos.module.js';

@Module({
  imports: [AgendamentosModule],
  controllers: [AppController, AgendamentosController],
  providers: [AppService],
})
export class AppModule {}
