
import { Injectable, NotFoundException } from '@nestjs/common';

type StatusSolicitacao = 'PENDENTE' | 'APROVADA' | 'RECUSADA';

export interface Sala {
  id: number;
  nome: string;
  localizacao: string;
  capacidade: number;
  recursos: string[];
}

export interface SolicitacaoSala {
  id: number;
  nomeSala: string;
  solicitante: string;
  justificativa: string;
  status: StatusSolicitacao;
  criadaEm: string;
}

@Injectable()
export class AdminService {
  private salas: Sala[] = [];
  private solicitacoes: SolicitacaoSala[] = [];

  private proximoIdSala = 1;
  private proximoIdSolicitacao = 1;

  dashboard() {
    return {
      totalSalas: this.salas.length,
      pendentes: this.solicitacoes.filter(
        s => s.status === 'PENDENTE',
      ).length,
      aprovadas: this.solicitacoes.filter(
        s => s.status === 'APROVADA',
      ).length,
      recusadas: this.solicitacoes.filter(
        s => s.status === 'RECUSADA',
      ).length,
    };
  }

  listarSalas() {
    return this.salas;
  }

  criarSala(dados: {
    nome: string;
    localizacao?: string;
    capacidade: number;
    recursos?: string[];
  }) {
    const sala: Sala = {
      id: this.proximoIdSala++,
      nome: dados.nome,
      localizacao: dados.localizacao ?? '',
      capacidade: dados.capacidade,
      recursos: dados.recursos ?? [],
    };

    this.salas.push(sala);
    return sala;
  }

  listarSolicitacoes() {
    return this.solicitacoes;
  }

  criarSolicitacao(dados: {
    nomeSala: string;
    solicitante: string;
    justificativa?: string;
  }) {
    const solicitacao: SolicitacaoSala = {
      id: this.proximoIdSolicitacao++,
      nomeSala: dados.nomeSala,
      solicitante: dados.solicitante,
      justificativa: dados.justificativa ?? '',
      status: 'PENDENTE',
      criadaEm: new Date().toISOString(),
    };

    this.solicitacoes.push(solicitacao);
    return solicitacao;
  }

  private alterarStatus(
    id: number,
    status: StatusSolicitacao,
  ) {
    const solicitacao = this.solicitacoes.find(
      s => s.id === Number(id),
    );

    if (!solicitacao) {
      throw new NotFoundException(
        'Solicitação não encontrada.',
      );
    }

    if (solicitacao.status !== 'PENDENTE') {
      throw new Error(
        'Esta solicitação já foi analisada.',
      );
    }

    solicitacao.status = status;
    return solicitacao;
  }

  aprovar(id: number) {
    return this.alterarStatus(id, 'APROVADA');
  }

  recusar(id: number) {
    return this.alterarStatus(id, 'RECUSADA');
  }
}
