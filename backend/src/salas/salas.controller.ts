import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AdminService } from '../admin/admin.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Entrada, EntradaDocument } from './schemas/entrada.schema.js';

const SALAS: Record<string, string> = {
  'SALA-201': 'Sala 201',
  'SALA-200': 'Sala 200',
  'LAB-CIENCIAS': 'Laboratório de Ciências',
};

@Controller('salas')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalasController {
  constructor(
    private readonly adminService: AdminService,
    @InjectModel(Entrada.name)
    private readonly entradaModel: Model<EntradaDocument>,
  ) {}

  // Lista as salas cadastradas no painel de ADMIN.
  // O formulário de agendamento usa isso para montar a lista de salas.
  @Get()
  listarSalas() {
    return this.adminService.listarSalas();
  }

  @Post('confirmar-entrada')
  async confirmarEntrada(@Body() body: { qrCode: string }) {
    if (typeof body?.qrCode !== 'string') {
      throw new BadRequestException('QR Code inválido.');
    }

    const codigo = body.qrCode.trim();

    if (!codigo.startsWith('EDUROOM:')) {
      throw new BadRequestException(
        'Este QR Code não pertence ao EduRoom.',
      );
    }

    const idSala = codigo.substring('EDUROOM:'.length);
    const nomeSala = SALAS[idSala];

    if (!nomeSala) {
      throw new BadRequestException(
        'Sala não encontrada ou QR Code inválido.',
      );
    }

    const entrada = {
      sala: nomeSala,
      horario: new Date().toISOString(),
    };

    // Fica salvo no banco (a memória do servidor não é confiável na Vercel)
    await this.entradaModel.create(entrada);

    return {
      sucesso: true,
      mensagem: 'Entrada confirmada com sucesso!',
      entrada,
    };
  }

  // Histórico de entradas: somente GESTOR
  @Roles('GESTOR')
  @Get('entradas')
  async listarEntradas() {
    const entradas = await this.entradaModel.find().sort({ horario: 1 }).exec();

    return entradas.map((entrada) => ({
      sala: entrada.sala,
      horario: entrada.horario,
    }));
  }
}