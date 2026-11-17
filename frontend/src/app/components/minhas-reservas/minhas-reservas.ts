
import {
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

interface Agendamento {
  id?: number | string;
  _id?: string;
  data?: string;
  hora?: string;
  sala?: string;
  materia?: string;
  status?: string;
}

type StatusReserva =
  | 'PENDENTE'
  | 'APROVADO'
  | 'REJEITADO'
  | 'OUTRO';

@Component({
  selector: 'app-minhas-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './minhas-reservas.html',
  styleUrl: './minhas-reservas.css',
})
export class MinhasReservasComponent implements OnInit {

  agendamentos: Agendamento[] = [];

  // FILTROS
  filtroSala = '';
  filtroStatus = '';
  buscaData = '';

  // ESTADOS
  carregando = false;
  erro = '';

  removendoIds: string[] = [];
  removendoTodos = false;

  private readonly apiUrl =
    `${environment.apiUrl.replace(/\/+$/, '')}/agendamentos`;

  constructor(
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    void this.carregarAgendamentos();
  }

  // =====================================
  // CARREGAR AGENDAMENTOS
  // =====================================

  async carregarAgendamentos(): Promise<void> {

    if (this.carregando) {
      return;
    }

    this.carregando = true;
    this.erro = '';
    this.cdr.markForCheck();

    try {
      const response = await fetch(this.apiUrl);

      if (!response.ok) {
        throw new Error(
          `Erro ao buscar agendamentos. HTTP ${response.status}`
        );
      }

      const dados: unknown = await response.json();

      if (!Array.isArray(dados)) {
        throw new Error(
          'A API não retornou uma lista de agendamentos.'
        );
      }

      this.agendamentos = dados
        .filter(
          (item): item is Agendamento =>
            item !== null &&
            typeof item === 'object' &&
            !Array.isArray(item)
        )
        .sort((a, b) => {

          const dataA =
            `${this.extrairApenasData(a.data)} ${a.hora ?? ''}`;

          const dataB =
            `${this.extrairApenasData(b.data)} ${b.hora ?? ''}`;

          return dataA.localeCompare(dataB);
        });

      this.erro = '';

    } catch (error) {

      console.error(
        'Erro ao carregar reservas:',
        error
      );

      this.agendamentos = [];

      this.erro =
        'Não foi possível carregar as reservas. Verifique a conexão com o backend.';

    } finally {

      this.carregando = false;
      this.cdr.markForCheck();

    }
  }

  // =====================================
  // FORMATAR DATAS
  // =====================================

  private extrairApenasData(
    dataInput: unknown
  ): string {

    if (!dataInput) {
      return '';
    }

    const valor = String(dataInput).trim();

    // Formato ISO
    const iso = valor.match(
      /^(\d{4}-\d{2}-\d{2})/
    );

    if (iso) {
      return iso[1];
    }

    // Formato brasileiro
    const brasileira = valor.match(
      /^(\d{2})\/(\d{2})\/(\d{4})$/
    );

    if (brasileira) {
      return (
        `${brasileira[3]}-` +
        `${brasileira[2]}-` +
        `${brasileira[1]}`
      );
    }

    return '';
  }

  formatarData(dataString: unknown): string {

    const data = this.extrairApenasData(
      dataString
    );

    if (!data) {
      return '-';
    }

    const [ano, mes, dia] = data.split('-');

    return `${dia}/${mes}/${ano}`;
  }

  formatarDia(dataString: unknown): string {

    const data = this.extrairApenasData(
      dataString
    );

    if (!data) {
      return '-';
    }

    const [ano, mes, dia] = data
      .split('-')
      .map(Number);

    const dataLocal = new Date(
      ano,
      mes - 1,
      dia
    );

    if (
      dataLocal.getFullYear() !== ano ||
      dataLocal.getMonth() !== mes - 1 ||
      dataLocal.getDate() !== dia
    ) {
      return '-';
    }

    const diasSemana = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado'
    ];

    return diasSemana[dataLocal.getDay()];
  }

  formatarHora(hora: unknown): string {

    if (!hora) {
      return '--:--';
    }

    return String(hora).slice(0, 5);
  }

  // =====================================
  // STATUS
  // =====================================

  private normalizarStatus(
    status: unknown
  ): StatusReserva {

    const valor = String(status ?? '')
      .trim()
      .toUpperCase();

    switch (valor) {
      case 'APROVADO':
        return 'APROVADO';

      case 'PENDENTE':
        return 'PENDENTE';

      case 'REJEITADO':
        return 'REJEITADO';

      default:
        return 'OUTRO';
    }
  }

  getStatusLabel(status: unknown): string {

    switch (this.normalizarStatus(status)) {
      case 'APROVADO':
        return 'Aprovado';

      case 'PENDENTE':
        return 'Aguardando aprovação';

      case 'REJEITADO':
        return 'Recusado';

      default:
        return 'Não informado';
    }
  }

  getStatusClass(status: unknown): string {

    switch (this.normalizarStatus(status)) {
      case 'APROVADO':
        return 'badge-aprovado';

      case 'PENDENTE':
        return 'badge-pendente';

      case 'REJEITADO':
        return 'badge-recusado';

      default:
        return 'badge-neutro';
    }
  }

  // =====================================
  // INDICADORES
  // =====================================

  get totalReservas(): number {
    return this.agendamentos.length;
  }

  get totalPendentes(): number {
    return this.contarPorStatus('PENDENTE');
  }

  get totalAprovadas(): number {
    return this.contarPorStatus('APROVADO');
  }

  get totalRecusadas(): number {
    return this.contarPorStatus('REJEITADO');
  }

  private contarPorStatus(
    status: StatusReserva
  ): number {

    return this.agendamentos.filter(
      agendamento =>
        this.normalizarStatus(agendamento.status) === status
    ).length;
  }

  // =====================================
  // FILTROS
  // =====================================

  get agendamentosFiltrados(): Agendamento[] {

    const busca = this.filtroSala
      .trim()
      .toLowerCase();

    return this.agendamentos.filter(
      agendamento => {

        const sala = String(
          agendamento.sala ?? ''
        ).toLowerCase();

        const correspondeSala =
          !busca || sala.includes(busca);

        const correspondeStatus =
          !this.filtroStatus ||
          this.normalizarStatus(
            agendamento.status
          ) === this.filtroStatus;

        const data = this.extrairApenasData(
          agendamento.data
        );

        const correspondeData =
          !this.buscaData ||
          data === this.buscaData;

        return (
          correspondeSala &&
          correspondeStatus &&
          correspondeData
        );
      }
    );
  }

  get temFiltros(): boolean {

    return Boolean(
      this.filtroSala ||
      this.filtroStatus ||
      this.buscaData
    );
  }

  selecionarStatus(status: string): void {
    this.filtroStatus = status;
  }

  limparFiltros(): void {

    this.filtroSala = '';
    this.filtroStatus = '';
    this.buscaData = '';

  }

  // =====================================
  // IDENTIFICAÇÃO DAS RESERVAS
  // =====================================

  obterId(agendamento: Agendamento): string {

    return String(
      agendamento.id ??
      agendamento._id ??
      ''
    );
  }

  estaRemovendo(id: number | string): boolean {

    return this.removendoIds.includes(
      String(id)
    );
  }

  trackByReserva(
    index: number,
    agendamento: Agendamento
  ): string | number {

    return this.obterId(agendamento) || index;
  }

  // =====================================
  // REMOVER UMA RESERVA
  // =====================================

  async removerAgendamento(
    id: number | string
  ): Promise<void> {

    const idTexto = String(id);

    if (
      !idTexto ||
      this.removendoIds.includes(idTexto) ||
      this.removendoTodos
    ) {
      return;
    }

    const confirmar = window.confirm(
      'Tem certeza de que deseja remover esta reserva?'
    );

    if (!confirmar) {
      return;
    }

    this.removendoIds = [
      ...this.removendoIds,
      idTexto
    ];

    this.cdr.markForCheck();

    try {
      const response = await fetch(
        `${this.apiUrl}/${encodeURIComponent(idTexto)}`,
        {
          method: 'DELETE'
        }
      );

      if (response.status === 404) {

        await this.carregarAgendamentos();

        window.alert(
          'Essa reserva não existe mais no servidor. A lista foi atualizada.'
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          `Erro ao remover reserva. HTTP ${response.status}`
        );
      }

      this.agendamentos = this.agendamentos.filter(
        agendamento =>
          this.obterId(agendamento) !== idTexto
      );

      this.cdr.markForCheck();

      window.alert(
        'Reserva removida com sucesso!'
      );

    } catch (error) {

      console.error(
        'Erro ao remover reserva:',
        error
      );

      window.alert(
        'Não foi possível remover a reserva. Verifique o backend.'
      );

    } finally {

      this.removendoIds =
        this.removendoIds.filter(
          itemId => itemId !== idTexto
        );

      this.cdr.markForCheck();

    }
  }

  // =====================================
  // REMOVER TODAS AS RESERVAS
  // =====================================

  async removerTodos(): Promise<void> {

    if (
      this.removendoTodos ||
      this.removendoIds.length > 0 ||
      this.agendamentos.length === 0
    ) {
      return;
    }

    const confirmar = window.confirm(
      `Você está prestes a excluir TODAS as ${this.agendamentos.length} reservas retornadas pelo sistema.\n\n` +
      'Esta operação pode afetar reservas de outros usuários e não pode ser desfeita.\n\n' +
      'Deseja continuar?'
    );

    if (!confirmar) {
      return;
    }

    const confirmacao = window.prompt(
      'Para confirmar a exclusão de todas as reservas, digite EXCLUIR:'
    );

    if (confirmacao !== 'EXCLUIR') {
      return;
    }

    this.removendoTodos = true;
    this.cdr.markForCheck();

    try {
      const response = await fetch(
        this.apiUrl,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erro ao remover reservas. HTTP ${response.status}`
        );
      }

      this.agendamentos = [];
      this.cdr.markForCheck();

      window.alert(
        'Todas as reservas foram removidas!'
      );

    } catch (error) {

      console.error(
        'Erro ao remover todas as reservas:',
        error
      );

      window.alert(
        'Não foi possível remover todas as reservas. Verifique o backend.'
      );

    } finally {

      this.removendoTodos = false;
      this.cdr.markForCheck();

    }
  }
}
