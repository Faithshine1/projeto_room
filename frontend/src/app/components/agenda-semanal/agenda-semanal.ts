import { Component, OnInit, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
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

  // 1. Criação do emissor de eventos para avisar o Dashboard
  @Output() agendamentoConcluido = new EventEmitter<void>();

  diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  horarios = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '17:00'];
  agendamentos: any[] = [];

  form = {
    sala: 'Laboratório de Ciências',
    data: '',
    hora: '08:00'
  };

  tipoReserva: 'dia' | 'semana' | 'mes' = 'dia';

  semanaInicio: Date = new Date();
  datasDaSemana: string[] = [];
  rotuloSemana = '';

  mostrarConfirmacao = false;
  diaConfirmacao: string | null = null;
  periodoConfirmacao = '';
  datasParaAgendar: string[] = [];

  aviso: { texto: string; tipo: 'sucesso' | 'erro' } | null = null;
  private avisoTimer: any;

  private apiUrl = 'http://localhost:3001/agendamentos';

  constructor(
    private cdr: ChangeDetectorRef,
    private dadosService: DadosService
  ) {
    this.definirSemana(this.segundaDe(new Date()));
  }

  ngOnInit() {
    this.carregarAgendamentos();
  }

  get nomeProfessor(): string {
    const usr = localStorage.getItem('usuario');
    if (usr) {
      try { return JSON.parse(usr).nome || 'Professor'; } catch { return 'Professor'; }
    }
    return 'Professor';
  }

  get dataMinima(): string {
    return this.paraIso(new Date());
  }

  private paraIso(data: Date): string {
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${data.getFullYear()}-${mes}-${dia}`;
  }

  private deIso(dataString: string): Date {
    const [ano, mes, dia] = dataString.split('-');
    return new Date(+ano, +mes - 1, +dia);
  }

  private somarDias(data: Date, dias: number): Date {
    const copia = new Date(data);
    copia.setDate(copia.getDate() + dias);
    return copia;
  }

  private segundaDe(data: Date): Date {
    const copia = new Date(data.getFullYear(), data.getMonth(), data.getDate());
    const deslocamento = (copia.getDay() + 6) % 7;
    copia.setDate(copia.getDate() - deslocamento);
    return copia;
  }

  private datasDaSemanaDe(dataString: string): string[] {
    const segunda = this.segundaDe(this.deIso(dataString));
    return [0, 1, 2, 3, 4].map(i => this.paraIso(this.somarDias(segunda, i)));
  }

  private datasDoMesDe(dataString: string): string[] {
    const segundaInicial = this.segundaDe(this.deIso(dataString));
    const datas: string[] = [];

    for (let semana = 0; semana < 4; semana++) {
      for (let dia = 0; dia < 5; dia++) {
        datas.push(this.paraIso(this.somarDias(segundaInicial, semana * 7 + dia)));
      }
    }
    return datas;
  }

  formatarData(dataString: string): string {
    if (!dataString) return '';
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  private formatarDataCurta(dataString: string): string {
    const [, mes, dia] = dataString.split('-');
    return `${dia}/${mes}`;
  }

  obterDiaDaSemana(dataString: string): string | null {
    if (!dataString) return null;
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return dias[this.deIso(dataString).getDay()];
  }

  private definirSemana(segunda: Date) {
    this.semanaInicio = segunda;
    this.datasDaSemana = [0, 1, 2, 3, 4].map(i => this.paraIso(this.somarDias(segunda, i)));
    this.rotuloSemana = `${this.formatarDataCurta(this.datasDaSemana[0])} – ${this.formatarDataCurta(this.datasDaSemana[4])}`;
  }

  semanaAnterior() { this.definirSemana(this.somarDias(this.semanaInicio, -7)); }
  proximaSemana() { this.definirSemana(this.somarDias(this.semanaInicio, 7)); }
  irParaHoje() { this.definirSemana(this.segundaDe(new Date())); }
  private irParaSemanaDe(dataString: string) { this.definirSemana(this.segundaDe(this.deIso(dataString))); }

  ehHoje(indice: number): boolean { return this.datasDaSemana[indice] === this.dataMinima; }
  numeroDoDia(indice: number): string { return this.datasDaSemana[indice].slice(8); }

  mostrarAviso(texto: string, tipo: 'sucesso' | 'erro' = 'sucesso') {
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
      if (!response.ok) throw new Error('Erro ao buscar agendamentos.');
      this.agendamentos = await response.json();

      this.dadosService.alterarAgendamentos(
        this.agendamentos.filter(a => a.status !== 'REJEITADO').length
      );
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    }
  }

  private extrairApenasData(dataInput: any): string {
    if (!dataInput) return '';
    return String(dataInput).split('T')[0].trim();
  }

  private horarioOcupado(data: string, hora: string): boolean {
    return this.agendamentos.some(a => {
      const dataMatch = this.extrairApenasData(a.data) === data;
      const horaMatch = String(a.hora).slice(0, 5) === hora.slice(0, 5);
      const naoRejeitado = a.status !== 'REJEITADO';
      return dataMatch && horaMatch && naoRejeitado;
    });
  }

  getAgendamentoSlot(dia: string, hora: string) {
    const indice = this.diasSemana.indexOf(dia);
    if (indice === -1) return undefined;
    const dataAlvo = this.datasDaSemana[indice];

    return this.agendamentos.find(a => {
      const dataMatch = this.extrairApenasData(a.data) === dataAlvo;
      const horaMatch = String(a.hora).slice(0, 5) === hora.slice(0, 5);
      const naoRejeitado = a.status !== 'REJEITADO';
      return dataMatch && horaMatch && naoRejeitado;
    });
  }

  handleSubmit() {
    if (!this.form.data) {
      this.mostrarAviso('Selecione uma data!', 'erro');
      return;
    }

    const hoje = this.dataMinima;
    const horasParaVerificar = this.form.hora === 'todos' ? this.horarios : [this.form.hora];

    if (this.tipoReserva === 'mes') {
      const datas = this.datasDoMesDe(this.form.data).filter(d => d >= hoje);
      if (datas.length === 0) {
        this.mostrarAviso('O período selecionado já passou.', 'erro');
        return;
      }
      
      const ocupadas = datas.filter(d => horasParaVerificar.some(h => this.horarioOcupado(d, h)));
      
      if (ocupadas.length > 0) {
        const lista = ocupadas.slice(0, 3).map(d => this.formatarDataCurta(d)).join(', ');
        const mais = ocupadas.length > 3 ? ` e mais ${ocupadas.length - 3} data(s)` : '';
        this.mostrarAviso(`Conflito: horário ocupado em ${lista}${mais}.`, 'erro');
        return;
      }
      this.datasParaAgendar = datas;
      this.periodoConfirmacao = `${this.formatarData(datas[0])} a ${this.formatarData(datas[datas.length - 1])}`;
      this.diaConfirmacao = `${datas.length} dias úteis (4 semanas - Pendente)`;
      this.mostrarConfirmacao = true;
      this.cdr.detectChanges();
      return;
    }

    if (this.tipoReserva === 'semana') {
      const datas = this.datasDaSemanaDe(this.form.data).filter(d => d >= hoje);
      if (datas.length === 0) {
        this.mostrarAviso('Essa semana já passou.', 'erro');
        return;
      }
      
      const ocupadas = datas.filter(d => horasParaVerificar.some(h => this.horarioOcupado(d, h)));
      
      if (ocupadas.length > 0) {
        const lista = ocupadas.map(d => this.formatarDataCurta(d)).join(', ');
        this.mostrarAviso(`O horário já está ocupado em: ${lista}.`, 'erro');
        return;
      }
      this.datasParaAgendar = datas;
      this.periodoConfirmacao = `${this.formatarData(datas[0])} a ${this.formatarData(datas[datas.length - 1])}`;
      this.diaConfirmacao = datas.map(d => this.obterDiaDaSemana(d)).join(', ');
      this.mostrarConfirmacao = true;
      this.cdr.detectChanges();
      return;
    }

    const diaSemana = this.obterDiaDaSemana(this.form.data);
    if (diaSemana === 'Sábado' || diaSemana === 'Domingo') {
      this.mostrarAviso('Agendamentos apenas de Segunda a Sexta!', 'erro');
      return;
    }
    
    const horarioEstaOcupado = horasParaVerificar.some(h => this.horarioOcupado(this.form.data, h));
    if (horarioEstaOcupado) {
      this.mostrarAviso(`Um ou mais horários já estão ocupados em ${this.formatarData(this.form.data)}!`, 'erro');
      return;
    }

    this.datasParaAgendar = [this.form.data];
    this.periodoConfirmacao = this.formatarData(this.form.data);
    this.diaConfirmacao = diaSemana;
    this.mostrarConfirmacao = true;
    this.cdr.detectChanges();
  }

  cancelarConfirmacao() {
    this.mostrarConfirmacao = false;
    this.diaConfirmacao = null;
    this.periodoConfirmacao = '';
    this.datasParaAgendar = [];
    this.cdr.detectChanges();
  }

  async confirmarAgendamento() {
    const datas = [...this.datasParaAgendar];
    const total = datas.length;
    const sala = this.form.sala;
    const textoDia = this.diaConfirmacao;
    const status = this.tipoReserva === 'mes' ? 'PENDENTE' : 'APROVADO';

    const horasParaAgendar = this.form.hora === 'todos' ? this.horarios : [this.form.hora];

    let criados = 0;
    let mensagemErroServidor = '';

    for (const data of datas) {
      for (const hora of horasParaAgendar) {
        try {
          const payload: any = {
            sala,
            data,
            hora,
            materia: 'Agendado'
          };

          if (this.nomeProfessor) payload.professor = this.nomeProfessor;
          if (this.tipoReserva === 'mes') payload.status = status;

          const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            criados++;
          } else {
            const erroJson = await response.json().catch(() => ({}));
            console.error('Erro retornado pela API NestJS:', response.status, erroJson);
            mensagemErroServidor = erroJson.message || `Erro ${response.status} na API`;
          }
        } catch (error) {
          console.error('Erro de conexão com o servidor:', error);
          mensagemErroServidor = 'Sem conexão com o servidor NestJS.';
          break;
        }
      }
    }

    if (criados === 0) {
      this.mostrarAviso(mensagemErroServidor || 'Erro ao criar agendamento.', 'erro');
      return;
    }

    await this.carregarAgendamentos();

    this.mostrarConfirmacao = false;
    this.diaConfirmacao = null;
    this.periodoConfirmacao = '';
    this.datasParaAgendar = [];

    this.irParaSemanaDe(datas[0]);

    if (this.tipoReserva === 'mes') {
      this.mostrarAviso(`Solicitação mensal enviada! Aguardando aprovação.`, 'sucesso');
    } else {
      const horaInfo = this.form.hora === 'todos' ? 'o dia todo' : `às ${this.form.hora}`;
      this.mostrarAviso(total === 1 ? `Agendado com sucesso para ${textoDia} para ${horaInfo}!` : `Semana agendada para ${horaInfo}!`, 'sucesso');
    }

    // 2. Dispara o evento para o Dashboard saber que terminou o agendamento
    this.agendamentoConcluido.emit();
  }
}