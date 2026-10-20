
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Sala {
  id: number;
  nome: string;
  localizacao: string;
  capacidade: number;
  recursos: string[];
}

interface Solicitacao {
  id: number;
  nomeSala: string;
  solicitante: string;
  justificativa: string;
  status: 'PENDENTE' | 'APROVADA' | 'RECUSADA';
  criadaEm: string;
}

interface Dashboard {
  totalSalas: number;
  pendentes: number;
  aprovadas: number;
  recusadas: number;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  private readonly api ='http://localhost:3001/admin';

  secao = 'inicio';
  carregando = false;
  mensagem = '';
  erro = '';

  dashboard: Dashboard = {
    totalSalas: 0,
    pendentes: 0,
    aprovadas: 0,
    recusadas: 0,
  };

  salas: Sala[] = [];
  solicitacoes: Solicitacao[] = [];

  novaSala = {
    nome: '',
    localizacao: '',
    capacidade: 30,
    recursosTexto: '',
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.carregando = true;
    this.erro = '';

    let concluidas = 0;
    const finalizar = () => {
      concluidas++;
      if (concluidas === 3) {
        this.carregando = false;
      }
    };

    this.http.get<Dashboard>(`${this.api}/dashboard`).subscribe({
      next: (dados) => {
        this.dashboard = dados;
        finalizar();
      },
      error: () => {
        this.erro = 'Não foi possível carregar o dashboard.';
        finalizar();
      },
    });

    this.http.get<Sala[]>(`${this.api}/salas`).subscribe({
      next: (dados) => {
        this.salas = dados;
        finalizar();
      },
      error: () => {
        this.erro = 'Não foi possível carregar as salas.';
        finalizar();
      },
    });

    this.http.get<Solicitacao[]>(`${this.api}/solicitacoes`).subscribe({
      next: (dados) => {
        this.solicitacoes = dados;
        finalizar();
      },
      error: () => {
        this.erro = 'Não foi possível carregar as solicitações.';
        finalizar();
      },
    });
  }

  mudarSecao(secao: string): void {
    this.secao = secao;
    this.mensagem = '';
    this.erro = '';
  }

  criarSala(): void {
    this.mensagem = '';
    this.erro = '';

    if (!this.novaSala.nome.trim()) {
      this.erro = 'Informe o nome da sala.';
      return;
    }

    if (!Number.isFinite(this.novaSala.capacidade) ||
        this.novaSala.capacidade < 1) {
      this.erro = 'A capacidade deve ser maior que zero.';
      return;
    }

    const recursos = this.novaSala.recursosTexto
      .split(',')
      .map((recurso) => recurso.trim())
      .filter((recurso) => recurso.length > 0);

    this.http.post<Sala>(`${this.api}/salas`, {
      nome: this.novaSala.nome.trim(),
      localizacao: this.novaSala.localizacao.trim(),
      capacidade: this.novaSala.capacidade,
      recursos,
    }).subscribe({
      next: () => {
        this.mensagem = 'Sala criada com sucesso!';
        this.novaSala = {
          nome: '',
          localizacao: '',
          capacidade: 30,
          recursosTexto: '',
        };
        this.carregarDados();
      },
      error: () => {
        this.erro = 'Não foi possível criar a sala.';
      },
    });
  }

  analisarSolicitacao(id: number, acao: 'aprovar' | 'recusar'): void {
    this.mensagem = '';
    this.erro = '';

    this.http.patch<Solicitacao>(
      `${this.api}/solicitacoes/${id}/${acao}`,
      {},
    ).subscribe({
      next: () => {
        this.mensagem = acao === 'aprovar'
          ? 'Solicitação aprovada!'
          : 'Solicitação recusada!';
        this.carregarDados();
      },
      error: (resposta) => {
        this.erro = resposta.error?.message
          || 'Não foi possível atualizar a solicitação.';
      },
    });
  }
}
