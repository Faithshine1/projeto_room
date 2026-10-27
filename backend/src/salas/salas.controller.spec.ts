import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { AdminService } from '../admin/admin.service.js';
import { SalasController } from './salas.controller.js';
import { Entrada } from './schemas/entrada.schema.js';

describe('SalasController', () => {
  let controller: SalasController;
  const salvas: { sala: string; horario: string }[] = [];

  // O banco real não é usado nos testes: este objeto imita só o que o controller usa
  const entradaModel = {
    create: async (entrada: { sala: string; horario: string }) => {
      salvas.push(entrada);
      return entrada;
    },
    find: () => ({ sort: () => ({ exec: async () => salvas }) }),
  };

  beforeEach(async () => {
    salvas.length = 0;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SalasController],
      providers: [
        { provide: AdminService, useValue: { listarSalas: async () => [] } },
        { provide: getModelToken(Entrada.name), useValue: entradaModel },
      ],
    }).compile();

    controller = module.get<SalasController>(SalasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('confirma a entrada e salva no banco', async () => {
    const resposta = await controller.confirmarEntrada({
      qrCode: 'EDUROOM:SALA-201',
    });

    expect(resposta.sucesso).toBe(true);
    expect(salvas).toHaveLength(1);
    expect(salvas[0].sala).toBe('Sala 201');
  });

  it('recusa QR Code que não é do EduRoom', async () => {
    await expect(
      controller.confirmarEntrada({ qrCode: 'OUTRO:SALA-201' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lista as entradas salvas', async () => {
    await controller.confirmarEntrada({ qrCode: 'EDUROOM:LAB-CIENCIAS' });

    const entradas = await controller.listarEntradas();

    expect(entradas).toHaveLength(1);
    expect(entradas[0].sala).toBe('Laboratório de Ciências');
  });
});
