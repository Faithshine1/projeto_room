
import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AdminService } from '../admin/admin.service.js';
import {
  Entrada,
  EntradaDocument,
} from './schemas/entrada.schema.js';

@Injectable()
export class SalasService {
  constructor(
    private readonly adminService: AdminService,

    @InjectModel(Entrada.name)
    private readonly entradaModel: Model<EntradaDocument>,
  ) {}

  // LISTAR SALAS CADASTRADAS
  async listarSalas() {
    return this.adminService.listarSalas();
  }

  // CONFIRMAR ENTRADA PELO QR CODE
  async confirmarEntrada(qrCode: string) {
    if (typeof qrCode !== 'string') {
      throw new BadRequestException('QR Code inválido.');
    }

    const codigo = qrCode.trim();

    if (!codigo.startsWith('EDUROOM:')) {
      throw new BadRequestException(
        'Este QR Code não pertence ao EduRoom.',
      );
    }

    const idSala = codigo.substring('EDUROOM:'.length);

    if (!idSala) {
      throw new BadRequestException(
        'Identificador da sala inválido.',
      );
    }

    // Busca as salas cadastradas no MongoDB
    const salas = await this.adminService.listarSalas();

    const salaEncontrada = salas.find(
      (sala: any) =>
        String(sala.id ?? sala._id) === idSala,
    );

    if (!salaEncontrada) {
      throw new BadRequestException(
        'Sala não encontrada ou QR Code inválido.',
      );
    }

    const nomeSala = salaEncontrada.nome;

    if (!nomeSala) {
      throw new BadRequestException(
        'Não foi possível identificar a sala.',
      );
    }

    // REGISTRAR ENTRADA
    const entrada = {
      sala: nomeSala,
      horario: new Date().toISOString(),
    };

    await this.entradaModel.create(entrada);

    return {
      sucesso: true,
      mensagem: 'Entrada confirmada com sucesso!',
      entrada,
    };
  }

  // LISTAR ENTRADAS
  async listarEntradas() {
    const entradas = await this.entradaModel
      .find()
      .sort({ horario: -1 })
      .exec();

    return entradas.map((entrada) => ({
      sala: entrada.sala,
      horario: entrada.horario,
    }));
  }
}
