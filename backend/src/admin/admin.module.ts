
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

import { Sala, SalaSchema } from './schemas/sala.schema.js';
import {
  Solicitacao,
  SolicitacaoSchema,
} from './schemas/solicitacao.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sala.name, schema: SalaSchema },
      { name: Solicitacao.name, schema: SolicitacaoSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
