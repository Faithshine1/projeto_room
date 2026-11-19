import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { AgendamentosController } from './agendamentos.controller.js';
import { AgendamentosService } from './agendamentos.service.js';

describe('AgendamentosController', () => {
  let controller: AgendamentosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgendamentosController],
      // O service real precisa do MongoDB; no teste usamos um objeto vazio
      providers: [{ provide: AgendamentosService, useValue: {} }],
    })
      // Os guards precisam do banco e do token; no teste a rota fica liberada
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AgendamentosController>(AgendamentosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
