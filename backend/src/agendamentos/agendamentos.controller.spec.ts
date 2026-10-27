import { Test, TestingModule } from '@nestjs/testing';
import { AgendamentosController } from './agendamentos.controller.js';
import { AgendamentosService } from './agendamentos.service.js';

describe('AgendamentosController', () => {
  let controller: AgendamentosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgendamentosController],
      // O service real precisa do MongoDB; no teste usamos um objeto vazio
      providers: [{ provide: AgendamentosService, useValue: {} }],
    }).compile();

    controller = module.get<AgendamentosController>(AgendamentosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
