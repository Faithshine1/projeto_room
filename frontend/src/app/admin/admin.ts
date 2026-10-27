import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

interface Sala {
  id: string;
  nome: string;
  localizacao: string;
  capacidade: number;
  recursos: string[];
}

// Formato que a tela já usava. Cada reserva do sistema é exibida como uma "solicitação".
interface Solicitacao {
  id: string;
  nomeSala: string;
  solicitante: string;
  justificativa: string;
  status: 'PENDENTE' | 'APROVADA' | 'RECUSADA';
  criadaEm: string;
}

// Formato que vem do backend (GET /agendamentos)
interface AgendamentoApi {
  id: string;
  sala: string;
  materia: string;
  data: string;
  hora: string;
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  professor: string;
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
  private readonly api = 'http://localhost:3001/admin';
  private readonly apiAgendamentos = 'http://localhost:3001/agendamentos';

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

  // Salas marcadas na tabela (para remover várias de uma vez)
  salasSelecionadas: string[] = [];
  removendoSalas = false;

  novaSala = {
    nome: '',
    localizacao: '',
    capacidade: 30,
    recursosTexto: '',
  };

  // Angular 22 é "zoneless": depois de uma resposta HTTP é preciso avisar
  // o Angular para redesenhar a tela (markForCheck).
  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.carregando = true;
    this.erro = '';

    let concluidas = 0;
    const finalizar = () => {
      concluidas++;
      if (concluidas === 2) {
        this.carregando = false;
      }
      this.atualizarResumo();
      this.cdr.markForCheck();
    };

    this.http.get<Sala[]>(`${this.api}/salas`).subscribe({
      next: (dados) => {
        this.salas = dados;
        // Descarta da seleção salas que não existem mais
        this.salasSelecionadas = this.salasSelecionadas.filter((id) =>
          dados.some((sala) => sala.id === id),
        );
        finalizar();
      },
      error: () => {
        this.erro = 'Não foi possível carregar as salas.';
        finalizar();
      },
    });

    this.http.get<AgendamentoApi[]>(this.apiAgendamentos).subscribe({
      next: (dados) => {
        this.solicitacoes = this.ordenar(dados.map((a) => this.paraSolicitacao(a)));
        finalizar();
      },
      error: () => {
        this.erro = 'Não foi possível carregar as solicitações de reserva.';
        finalizar();
      },
    });
  }

  // Converte uma reserva no formato de "solicitação" usado pela tela
  private paraSolicitacao(a: AgendamentoApi): Solicitacao {
    const [ano, mes, dia] = String(a.data).split('-');
    const detalhe = a.materia ? ` · ${a.materia}` : '';

    return {
      id: a.id,
      nomeSala: a.sala,
      solicitante: a.professor || 'Professor',
      justificativa: `Reserva para ${dia}/${mes}/${ano} às ${a.hora}${detalhe}`,
      status:
        a.status === 'APROVADO'
          ? 'APROVADA'
          : a.status === 'REJEITADO'
            ? 'RECUSADA'
            : 'PENDENTE',
      criadaEm: a.criadaEm,
    };
  }

  // Pendentes primeiro (são as que precisam de ação); o resto mantém a ordem
  private ordenar(lista: Solicitacao[]): Solicitacao[] {
    const peso = (s: Solicitacao) => (s.status === 'PENDENTE' ? 0 : 1);
    return [...lista].sort((a, b) => peso(a) - peso(b));
  }

  private atualizarResumo(): void {
    const contar = (status: Solicitacao['status']) =>
      this.solicitacoes.filter((s) => s.status === status).length;

    this.dashboard = {
      totalSalas: this.salas.length,
      pendentes: contar('PENDENTE'),
      aprovadas: contar('APROVADA'),
      recusadas: contar('RECUSADA'),
    };
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
        this.mensagem = 'Sala criada com sucesso! Ela já aparece para os usuários na hora de agendar.';
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
        this.cdr.markForCheck();
      },
    });
  }

  // ---------- Seleção e remoção de salas ----------

  get todasSelecionadas(): boolean {
    return (
      this.salas.length > 0 &&
      this.salasSelecionadas.length === this.salas.length
    );
  }

  estaSelecionada(id: string): boolean {
    return this.salasSelecionadas.includes(id);
  }

  alternarSelecao(id: string): void {
    this.salasSelecionadas = this.estaSelecionada(id)
      ? this.salasSelecionadas.filter((item) => item !== id)
      : [...this.salasSelecionadas, id];
  }

  alternarTodas(): void {
    this.salasSelecionadas = this.todasSelecionadas
      ? []
      : this.salas.map((sala) => sala.id);
  }

  async removerSala(sala: Sala): Promise<void> {
    if (this.removendoSalas) {
      return;
    }

    const confirmar = window.confirm(
      `Remover a sala "${sala.nome}"?\n\n` +
        'Ela deixará de aparecer para os usuários na hora de agendar. ' +
        'Reservas já feitas nela continuam existindo.',
    );

    if (!confirmar) {
      return;
    }

    this.mensagem = '';
    this.erro = '';
    this.removendoSalas = true;

    try {
      await firstValueFrom(this.http.delete(`${this.api}/salas/${sala.id}`));

      this.mensagem = `Sala "${sala.nome}" removida.`;
      this.salasSelecionadas = this.salasSelecionadas.filter(
        (id) => id !== sala.id,
      );
      this.carregarDados();
    } catch (e: any) {
      this.erro = e?.error?.message || 'Não foi possível remover a sala.';
    } finally {
      this.removendoSalas = false;
      this.cdr.markForCheck();
    }
  }

  async removerSelecionadas(): Promise<void> {
    const ids = [...this.salasSelecionadas];

    if (this.removendoSalas || ids.length === 0) {
      return;
    }

    const confirmar = window.confirm(
      `Remover ${ids.length} sala(s) selecionada(s)?\n\n` +
        'Elas deixarão de aparecer para os usuários na hora de agendar. ' +
        'Reservas já feitas nelas continuam existindo.',
    );

    if (!confirmar) {
      return;
    }

    this.mensagem = '';
    this.erro = '';
    this.removendoSalas = true;

    let removidas = 0;
    let falhas = 0;

    for (const id of ids) {
      try {
        await firstValueFrom(this.http.delete(`${this.api}/salas/${id}`));
        removidas++;
      } catch {
        falhas++;
      }
    }

    if (falhas === 0) {
      this.mensagem = `${removidas} sala(s) removida(s).`;
    } else {
      this.erro = `${removidas} sala(s) removida(s), mas ${falhas} não puderam ser removidas.`;
    }

    this.salasSelecionadas = [];
    this.removendoSalas = false;
    this.carregarDados();
  }

  analisarSolicitacao(id: string, acao: 'aprovar' | 'recusar'): void {
    this.mensagem = '';
    this.erro = '';

    this.http.patch(
      `${this.apiAgendamentos}/${id}/${acao}`,
      {},
    ).subscribe({
      next: () => {
        this.mensagem = acao === 'aprovar'
          ? 'Reserva aprovada!'
          : 'Reserva recusada!';
        this.carregarDados();
      },
      error: (resposta) => {
        this.erro = resposta.error?.message
          || 'Não foi possível atualizar a reserva.';
        this.cdr.markForCheck();
      },
    });
  }
}
