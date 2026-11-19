import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module.js';
import { AgendamentosController } from './agendamentos.controller.js';
import { AgendamentosService } from './agendamentos.service.js';
import {
  Agendamento,
  AgendamentoSchema,
} from './schemas/agendamento.schema.js';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Agendamento.name, schema: AgendamentoSchema },
    ]),
  ],
  controllers: [AgendamentosController],
  providers: [AgendamentosService],
  exports: [AgendamentosService],
})
export class AgendamentosModule {}
