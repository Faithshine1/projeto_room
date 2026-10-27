import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-minhas-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './minhas-reservas.html',
  styleUrl: './minhas-reservas.css',
})
export class MinhasReservasComponent implements OnInit {
  agendamentos: any[] = [];

  filtroSala = '';
  filtroStatus = '';
  buscaData = '';

  removendoIds: string[] = [];
  removendoTodos = false;

  // Mensagem mostrada na tabela quando a lista não pôde ser carregada
  erro = '';

  private apiUrl = `${environment.apiUrl}/agendamentos`;

  // O Angular 22 não usa zone.js por padrão (modo "zoneless"). Isso significa que
  // alterar uma propriedade depois de um await/fetch NÃO atualiza a tela sozinho.
  // Por isso injetamos o ChangeDetectorRef e avisamos o Angular com markForCheck().
  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.carregarAgendamentos();
  }

  async carregarAgendamentos(): Promise<void> {
    try {
      const response = await fetch(this.apiUrl);

      if (!response.ok) {
        throw new Error(`Erro ao buscar agendamentos. HTTP ${response.status}`);
      }

      const dados = await response.json();

      if (!Array.isArray(dados)) {
        throw new Error('A API não retornou uma lista de agendamentos.');
      }

      this.agendamentos = dados.sort((a: any, b: any) => {
        const dataA = `${this.extrairApenasData(a.data)} ${a.hora ?? ''}`;
        const dataB = `${this.extrairApenasData(b.data)} ${b.hora ?? ''}`;

        return dataA.localeCompare(dataB);
      });

      this.erro = '';
    } catch (error) {
      console.error('Erro ao carregar reservas:', error);
      this.erro =
        'Não foi possível carregar as reservas. Verifique se o backend está rodando.';
    } finally {
      // Garante que a tela seja redesenhada com a lista (ou com a mensagem de erro)
      this.cdr.markForCheck();
    }
  }

  private extrairApenasData(dataInput: any): string {
    if (!dataInput) {
      return '';
    }

    const valor = String(dataInput).trim();

    // Formato ISO: 2026-10-27 ou 2026-10-27T14:30:00
    const iso = valor.match(/^(\d{4}-\d{2}-\d{2})/);

    if (iso) {
      return iso[1];
    }

    // Formato brasileiro: 27/10/2026
    const brasileira = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

    if (brasileira) {
      return `${brasileira[3]}-${brasileira[2]}-${brasileira[1]}`;
    }

    return '';
  }

  formatarData(dataString: string): string {
    const data = this.extrairApenasData(dataString);

    if (!data) {
      return '-';
    }

    const [ano, mes, dia] = data.split('-');

    return `${dia}/${mes}/${ano}`;
  }

  formatarDia(dataString: string): string {
    const data = this.extrairApenasData(dataString);

    if (!data) {
      return '-';
    }

    const [ano, mes, dia] = data.split('-').map(Number);
    const dataLocal = new Date(ano, mes - 1, dia);

    // Evita aceitar datas inválidas silenciosamente.
    if (
      dataLocal.getFullYear() !== ano ||
      dataLocal.getMonth() !== mes - 1 ||
      dataLocal.getDate() !== dia
    ) {
      return '-';
    }

    const diaSemana = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ];

    return diaSemana[dataLocal.getDay()];
  }

  async removerAgendamento(id: number | string): Promise<void> {
    const idTexto = String(id);

    if (this.removendoIds.includes(idTexto)) {
      return;
    }

    const confirmar = window.confirm(
      'Tem certeza de que deseja remover esta reserva?',
    );

    if (!confirmar) {
      return;
    }

    this.removendoIds = [...this.removendoIds, idTexto];

    try {
      const response = await fetch(
        `${this.apiUrl}/${encodeURIComponent(idTexto)}`,
        { method: 'DELETE' },
      );

      // 404 = o servidor não tem mais essa reserva (ex.: o backend reiniciou e
      // perdeu os dados em memória). Sincroniza a lista com o que existe de verdade.
      if (response.status === 404) {
        await this.carregarAgendamentos();
        window.alert(
          'Essa reserva não existe mais no servidor. A lista foi atualizada.',
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          `Não foi possível remover a reserva. HTTP ${response.status}`,
        );
      }

      this.agendamentos = this.agendamentos.filter(
        (agendamento) => String(agendamento.id) !== idTexto,
      );
      this.cdr.markForCheck();

      window.alert('Reserva removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover reserva:', error);
      window.alert(
        'Erro ao remover a reserva. Verifique o backend e tente novamente.',
      );
    } finally {
      this.removendoIds = this.removendoIds.filter(
        (itemId) => itemId !== idTexto,
      );
      // Sem isso o botão ficava preso em "Removendo..." e a linha não sumia
      this.cdr.markForCheck();
    }
  }

  async removerTodos(): Promise<void> {
    const total = this.agendamentos.length;

    if (this.removendoTodos || total === 0) {
      return;
    }

    const confirmar = window.confirm(
      `Tem certeza de que deseja remover TODAS as ${total} reservas? Essa ação não pode ser desfeita.`,
    );

    if (!confirmar) {
      return;
    }

    this.removendoTodos = true;

    try {
      const response = await fetch(this.apiUrl, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error(
          `Não foi possível remover as reservas. HTTP ${response.status}`,
        );
      }

      this.agendamentos = [];
      this.cdr.markForCheck();

      window.alert('Todas as reservas foram removidas!');
    } catch (error) {
      console.error('Erro ao remover todas as reservas:', error);
      window.alert(
        'Erro ao remover as reservas. Verifique o backend e tente novamente.',
      );
    } finally {
      this.removendoTodos = false;
      this.cdr.markForCheck();
    }
  }

  estaRemovendo(id: number | string): boolean {
    return this.removendoIds.includes(String(id));
  }

  get agendamentosFiltrados(): any[] {
    return this.agendamentos.filter((a) => {
      const matchSala =
        !this.filtroSala ||
        String(a.sala ?? '')
          .toLowerCase()
          .includes(this.filtroSala.toLowerCase());

      const matchStatus = !this.filtroStatus || a.status === this.filtroStatus;

      const dataReserva = this.extrairApenasData(a.data);

      const matchData = !this.buscaData || dataReserva === this.buscaData;

      return matchSala && matchStatus && matchData;
    });
  }

  limparFiltros(): void {
    this.filtroSala = '';
    this.filtroStatus = '';
    this.buscaData = '';
  }
}