
import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AgendamentosModule } from './agendamentos/agendamentos.module.js';
import { AdminModule } from './admin/admin.module.js';
import { SalasController } from './salas/salas.controller.js';

@Module({
  imports: [
    AgendamentosModule,
    AdminModule,
  ],
  controllers: [AppController, SalasController],
  providers: [AppService],
})
export class AppModule {}
