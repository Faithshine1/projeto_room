import { Component } from '@angular/core';
import { OnInit } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DadosService } from '../../../Service/dados.service';

@Component({
  selector: 'app-agenda-semanal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agenda-semanal.html',
  styleUrl: './agenda-semanal.css'
})
export class AgendaSemanalComponent implements OnInit {

  diasSemana = [
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta'
  ];

  horarios = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '13:00',
    '14:00',
    '17:00'
  ];

  agendamentos: any[] = [];

  form = {
    sala: 'Laboratório de Ciências',
    data: '',
    hora: '08:00'
  };

  // Controla o modal de confirmação
  mostrarConfirmacao = false;

  // Guarda o dia que será exibido na confirmação
  diaConfirmacao: string | null = null;

  // Aviso (toast) exibido na tela no lugar do alert
  aviso: { texto: string; tipo: 'sucesso' | 'erro' } | null = null;

  private avisoTimer: any;

  private apiUrl =
    'http://localhost:3001/agendamentos';

  constructor(
    private cdr: ChangeDetectorRef,
    private dadosService: DadosService
  ) {}

  ngOnInit() {
    this.carregarAgendamentos();
  }

  // Nome do dia de hoje, para destacar a coluna na agenda
  get diaHoje(): string {
    const dias = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado'
    ];

    return dias[new Date().getDay()];
  }

  // Data mínima do campo de data (hoje), no formato AAAA-MM-DD
  get dataMinima(): string {
    const hoje = new Date();

    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    return `${hoje.getFullYear()}-${mes}-${dia}`;
  }

  // "2026-12-15" -> "15/12/2026"
  formatarData(dataString: string): string {
    if (!dataString) {
      return '';
    }

    const [ano, mes, dia] = dataString.split('-');

    return `${dia}/${mes}/${ano}`;
  }

  mostrarAviso(
    texto: string,
    tipo: 'sucesso' | 'erro' = 'sucesso'
  ) {
    this.aviso = { texto, tipo };

    this.cdr.detectChanges();

    clearTimeout(this.avisoTimer);

    this.avisoTimer = setTimeout(() => {
      this.aviso = null;
      this.cdr.detectChanges();
    }, 4000);
  }

  async carregarAgendamentos() {
    try {
      const response = await fetch(this.apiUrl);

      if (!response.ok) {
        throw new Error(
          'Erro ao buscar agendamentos.'
        );
      }

      this.agendamentos = await response.json();

      // Sincroniza o contador do painel com o total real
      this.dadosService.alterarAgendamentos(
        this.agendamentos.length
      );

      this.cdr.detectChanges();

    } catch (error) {
      console.error(
        'Erro ao buscar agendamentos:',
        error
      );
    }
  }

  obterDiaDaSemana(
    dataString: string
  ): string | null {

    if (!dataString) {
      return null;
    }

    const [ano, mes, dia] =
      dataString.split('-');

    const dataObj = new Date(
      +ano,
      +mes - 1,
      +dia
    );

    const dias = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado'
    ];

    return dias[dataObj.getDay()];
  }

  handleSubmit() {

    if (!this.form.data) {
      this.mostrarAviso('Selecione uma data!', 'erro');
      return;
    }

    const diaSemana =
      this.obterDiaDaSemana(
        this.form.data
      );

    if (
      diaSemana === 'Sábado' ||
      diaSemana === 'Domingo'
    ) {
      this.mostrarAviso(
        'Agendamentos apenas de Segunda a Sexta!',
        'erro'
      );

      return;
    }

    const agendamentoExistente =
      this.getAgendamentoSlot(
        diaSemana!,
        this.form.hora
      );

    if (agendamentoExistente) {
      this.mostrarAviso(
        `O horário ${this.form.hora} já está ocupado na ${diaSemana}!`,
        'erro'
      );

      return;
    }

    this.diaConfirmacao = diaSemana;

    this.mostrarConfirmacao = true;

    this.cdr.detectChanges();
  }

  cancelarConfirmacao() {

    this.mostrarConfirmacao = false;

    this.diaConfirmacao = null;

    this.cdr.detectChanges();
  }

  async confirmarAgendamento() {

    try {

      const diaAgendado =
        this.diaConfirmacao;

      const response = await fetch(
        this.apiUrl,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            sala: this.form.sala,
            data: this.form.data,
            hora: this.form.hora,
            materia: 'Agendado'
          })
        }
      );

      if (response.ok) {

        const resultado =
          await response.json();

        // Adiciona o agendamento ao calendário
        this.agendamentos.push(
          resultado.dados
        );

        // Soma 1 no contador do painel
        this.dadosService.adicionarAgendamento();

        // Fecha o modal
        this.mostrarConfirmacao = false;

        this.diaConfirmacao = null;

        this.mostrarAviso(
          `Agendado com sucesso para ${diaAgendado} às ${this.form.hora}!`,
          'sucesso'
        );

      } else {

        this.mostrarAviso(
          'Erro ao criar agendamento.',
          'erro'
        );
      }

    } catch (error) {

      console.error(
        'Erro ao conectar com o servidor:',
        error
      );

      this.mostrarAviso(
        'Não foi possível conectar com o servidor.',
        'erro'
      );
    }
  }

  getAgendamentoSlot(
    dia: string,
    hora: string
  ) {

    return this.agendamentos.find(
      a =>
        a.dia === dia &&
        a.hora === hora
    );
  }
}