import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdminModule } from '../admin/admin.module.js';
import { SalasController } from './salas.controller.js';
import { Entrada, EntradaSchema } from './schemas/entrada.schema.js';

@Module({
  imports: [
    // AdminModule exporta o AdminService, usado para listar as salas do painel
    AdminModule,
    MongooseModule.forFeature([{ name: Entrada.name, schema: EntradaSchema }]),
  ],
  controllers: [SalasController],
})
export class SalasModule {}
