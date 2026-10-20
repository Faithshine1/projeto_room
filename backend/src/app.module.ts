
import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AgendamentosModule } from './agendamentos/agendamentos.module.js';
import { AdminModule } from './admin/admin.module.js';

@Module({
  imports: [
    AgendamentosModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
