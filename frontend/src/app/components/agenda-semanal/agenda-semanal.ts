import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  private apiUrl =
    'http://localhost:3001/agendamentos';

  constructor(
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.carregarAgendamentos();
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
      alert('Selecione uma data!');
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
      alert(
        'Agendamentos apenas de Segunda a Sexta!'
      );

      return;
    }

    const agendamentoExistente =
      this.getAgendamentoSlot(
        diaSemana!,
        this.form.hora
      );

    if (agendamentoExistente) {
      alert(
        `O horário ${this.form.hora} já está ocupado na ${diaSemana}!`
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

        this.cdr.detectChanges();

        // Fecha o modal
        this.mostrarConfirmacao = false;

        this.diaConfirmacao = null;

        alert(
          `Agendado com sucesso para ${diaAgendado} às ${this.form.hora}!`
        );

      } else {

        alert(
          'Erro ao criar agendamento.'
        );
      }

    } catch (error) {

      console.error(
        'Erro ao conectar com o servidor:',
        error
      );

      alert(
        'Não foi possível conectar com o servidor.'
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