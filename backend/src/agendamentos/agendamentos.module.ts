import { Module } from '@nestjs/common';
import { AgendamentosController } from './agendamentos.controller.js';
@Module({
    controllers: [AgendamentosController],
})

export class AgendamentosModule {}
