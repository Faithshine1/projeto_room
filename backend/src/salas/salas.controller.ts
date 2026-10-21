import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';

const SALAS: Record<string, string> = {
  'SALA-201': 'Sala 201',
  'SALA-200': 'Sala 200',
  'LAB-CIENCIAS': 'Laboratório de Ciências',
};

// Os dados ficam na memória enquanto o backend estiver ligado.
const entradas: {
  sala: string;
  horario: string;
}[] = [];

@Controller('salas')
export class SalasController {
  @Post('confirmar-entrada')
  confirmarEntrada(@Body() body: { qrCode: string }) {
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

    entradas.push(entrada);

    return {
      sucesso: true,
      mensagem: 'Entrada confirmada com sucesso!',
      entrada,
    };
  }

  @Get('entradas')
  listarEntradas() {
    return entradas;
  }
}