
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  Output,
  EventEmitter,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DadosService } from '../../../Service/dados.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-agenda-semanal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agenda-semanal.html',
  styleUrl: './agenda-semanal.css',
})
export class AgendaSemanalComponent implements OnInit, OnDestroy {

  @Output() agendamentoConcluido = new EventEmitter<void>();

  diasSemana = [
    'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'
  ];

  // =========================================
  // HORÁRIOS DAS RESERVAS
  // =========================================

  horarios = [
    '07:30',
    '08:30',
    '09:30',
    '10:30',
    '11:30',
    '12:30',
    '13:30',
    '14:30',
    '15:30',
    '16:30'
  ];

  horariosSelecao = [...this.horarios, '17:30'];

  agendamentos: any[] = [];

  private readonly salasPadrao = [
    'Laboratório de Ciências',
    'Sala 201',
    'Sala 200',
  ];

  salas: string[] = [...this.salasPadrao];

  form = {
    sala: 'Laboratório de Ciências',
    data: '',
    hora: '07:30',
    materia: '',
  };

  horaFim = '11:30';
  diaTodo = false;

  seletorHorarioAberto: 'inicio' | 'fim' | null = null;

  tipoReserva: 'dia' | 'semana' | 'mes' = 'dia';

  semanaInicio: Date = new Date();
  datasDaSemana: string[] = [];
  rotuloSemana = '';

  mostrarFormulario = false;
  enviandoSolicitacao = false;

  diasMiniSemana = [
    'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'
  ];

  mesReferencia: Date = new Date();

  miniCalendario: {
    data: string;
    numero: number;
    doMes: boolean;
    hoje: boolean;
    naSemana: boolean;
  }[] = [];

  mostrarConfirmacao = false;
  diaConfirmacao: string | null = null;
  periodoConfirmacao = '';
  datasParaAgendar: string[] = [];

  aviso: {
    texto: string;
    tipo: 'sucesso' | 'erro';
  } | null = null;

  private avisoTimer:
    ReturnType<typeof setTimeout> | undefined;

  private readonly baseApiUrl =
    environment.apiUrl.replace(/\/+$/, '');

  private readonly apiUrl =
    `${this.baseApiUrl}/agendamentos`;

  private readonly apiSalas =
    `${this.baseApiUrl}/salas`;

  constructor(
    private cdr: ChangeDetectorRef,
    private dadosService: DadosService,
  ) {
    this.definirSemana(this.segundaDe(new Date()));
  }

  ngOnInit(): void {
    this.carregarSalas();
    this.carregarAgendamentos();
  }

  ngOnDestroy(): void {
    if (this.avisoTimer) {
      clearTimeout(this.avisoTimer);
    }
  }

  // =========================================
  // SISTEMA DE HORÁRIO POR INTERVALO
  // =========================================

  private paraMinutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);

    return h * 60 + m;
  }

  private paraHorario(minutos: number): string {

    const h = String(
      Math.floor(minutos / 60)
    ).padStart(2, '0');

    const m = String(
      minutos % 60
    ).padStart(2, '0');

    return `${h}:${m}`;
  }

  get horariosFimDisponiveis(): string[] {
    return this.horariosSelecao;
  }

  get intervaloValido(): boolean {

    if (this.diaTodo) {
      return true;
    }

    return (
      this.horarios.includes(this.form.hora) &&
      this.horariosSelecao.includes(this.horaFim) &&
      this.paraMinutos(this.horaFim) >
      this.paraMinutos(this.form.hora)
    );
  }

  ajustarHoraFim(): void {

    if (!this.horarios.includes(this.form.hora)) {
      return;
    }

    const inicio = this.paraMinutos(this.form.hora);
    const fim = this.paraMinutos(this.horaFim);

    if (
      !this.horariosSelecao.includes(this.horaFim) ||
      fim <= inicio
    ) {
      this.horaFim = this.paraHorario(inicio + 60);
    }
  }

  // =========================================
  // SELETOR PERSONALIZADO DE HORÁRIOS
  // =========================================

  alternarSeletorHorario(
    campo: 'inicio' | 'fim'
  ): void {

    if (this.diaTodo || this.enviandoSolicitacao) {
      return;
    }

    this.seletorHorarioAberto =
      this.seletorHorarioAberto === campo
        ? null
        : campo;
  }

  selecionarHorario(
    campo: 'inicio' | 'fim',
    horario: string
  ): void {

    if (
      this.diaTodo ||
      this.enviandoSolicitacao ||
      !this.horariosSelecao.includes(horario)
    ) {
      return;
    }

    if (campo === 'inicio') {

      this.form.hora = horario;
      this.ajustarHoraFim();

    } else {

      this.horaFim = horario;

    }

    this.seletorHorarioAberto = null;
  }

  fecharSeletorHorario(): void {
    this.seletorHorarioAberto = null;
  }

  selecionarPeriodo(
    inicio: string,
    fim: string
  ): void {

    this.diaTodo = false;
    this.form.hora = inicio;
    this.horaFim = fim;

    this.fecharSeletorHorario();
    this.ajustarHoraFim();
  }

  periodoSelecionado(
    inicio: string,
    fim: string
  ): boolean {

    return (
      !this.diaTodo &&
      this.form.hora === inicio &&
      this.horaFim === fim
    );
  }

  // Converte o intervalo em blocos de uma hora.
  // Exemplo: 07:30 às 10:30 = 3 blocos.

  get horasSelecionadas(): string[] {

    if (this.diaTodo) {
      return [...this.horarios];
    }

    if (!this.intervaloValido) {
      return [];
    }

    const inicio = this.paraMinutos(this.form.hora);
    const fim = this.paraMinutos(this.horaFim);

    return this.horarios.filter(hora => {

      const atual = this.paraMinutos(hora);

      return atual >= inicio && atual < fim;
    });
  }

  get resumoHorario(): string {

    return this.diaTodo
      ? '07:30 às 17:30'
      : `${this.form.hora} às ${this.horaFim}`;
  }

  // =========================================
  // CARREGAMENTO DAS SALAS
  // =========================================

  async carregarSalas(): Promise<void> {

    try {

      const response = await fetch(this.apiSalas);

      if (!response.ok) {
        throw new Error(
          `Erro HTTP ${response.status} ao buscar salas.`
        );
      }

      const lista: any[] = await response.json();
      const todas = [...this.salasPadrao];

      for (const sala of lista) {

        const nome = String(sala?.nome ?? '').trim();

        const jaExiste = todas.some(
          nomeExistente =>
            nomeExistente.toLowerCase() === nome.toLowerCase()
        );

        if (nome && !jaExiste) {
          todas.push(nome);
        }
      }

      this.salas = todas;

      if (!this.salas.includes(this.form.sala)) {
        this.form.sala = this.salas[0] ?? '';
      }

      this.cdr.detectChanges();

    } catch (error) {

      console.error('Erro ao buscar salas:', error);

    }
  }

  get nomeProfessor(): string {

    const usuario = localStorage.getItem('usuario');

    if (usuario) {

      try {
        return JSON.parse(usuario).nome || 'Professor';
      } catch {
        return 'Professor';
      }
    }

    return 'Professor';
  }

  // =========================================
  // DATAS
  // =========================================

  get dataMinima(): string {
    return this.paraIso(new Date());
  }

  private paraIso(data: Date): string {

    const mes = String(
      data.getMonth() + 1
    ).padStart(2, '0');

    const dia = String(
      data.getDate()
    ).padStart(2, '0');

    return `${data.getFullYear()}-${mes}-${dia}`;
  }

  private deIso(dataString: string): Date {

    const [ano, mes, dia] = dataString.split('-');

    return new Date(
      Number(ano),
      Number(mes) - 1,
      Number(dia)
    );
  }

  private somarDias(data: Date, dias: number): Date {

    const copia = new Date(data);

    copia.setDate(copia.getDate() + dias);

    return copia;
  }

  private segundaDe(data: Date): Date {

    const copia = new Date(
      data.getFullYear(),
      data.getMonth(),
      data.getDate()
    );

    const deslocamento = (copia.getDay() + 6) % 7;

    copia.setDate(copia.getDate() - deslocamento);

    return copia;
  }

  private datasDaSemanaDe(
    dataString: string
  ): string[] {

    const segunda = this.segundaDe(
      this.deIso(dataString)
    );

    return [0, 1, 2, 3, 4].map(i =>
      this.paraIso(this.somarDias(segunda, i))
    );
  }

  private datasDoMesDe(
    dataString: string
  ): string[] {

    const segundaInicial = this.segundaDe(
      this.deIso(dataString)
    );

    const datas: string[] = [];

    for (let semana = 0; semana < 4; semana++) {

      for (let dia = 0; dia < 5; dia++) {

        datas.push(
          this.paraIso(
            this.somarDias(
              segundaInicial,
              semana * 7 + dia
            )
          )
        );
      }
    }

    return datas;
  }

  formatarData(dataString: string): string {

    if (!dataString) {
      return '';
    }

    const [ano, mes, dia] = dataString.split('-');

    return `${dia}/${mes}/${ano}`;
  }

  private formatarDataCurta(
    dataString: string
  ): string {

    const [, mes, dia] = dataString.split('-');

    return `${dia}/${mes}`;
  }

  obterDiaDaSemana(
    dataString: string
  ): string | null {

    if (!dataString) {
      return null;
    }

    const dias = [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado',
    ];

    return dias[this.deIso(dataString).getDay()];
  }

  // =========================================
  // NAVEGAÇÃO SEMANAL
  // =========================================

  private definirSemana(segunda: Date): void {

    this.semanaInicio = segunda;

    this.datasDaSemana = [0, 1, 2, 3, 4].map(i =>
      this.paraIso(this.somarDias(segunda, i))
    );

    this.rotuloSemana =
      `${this.formatarDataCurta(this.datasDaSemana[0])} – ` +
      `${this.formatarDataCurta(this.datasDaSemana[4])}`;

    this.mesReferencia = new Date(
      segunda.getFullYear(),
      segunda.getMonth(),
      1
    );

    this.atualizarMiniCalendario();
  }

  semanaAnterior(): void {

    this.definirSemana(
      this.somarDias(this.semanaInicio, -7)
    );
  }

  proximaSemana(): void {

    this.definirSemana(
      this.somarDias(this.semanaInicio, 7)
    );
  }

  irParaHoje(): void {

    this.definirSemana(
      this.segundaDe(new Date())
    );
  }

  private irParaSemanaDe(dataString: string): void {

    this.definirSemana(
      this.segundaDe(this.deIso(dataString))
    );
  }

  ehHoje(indice: number): boolean {

    return (
      this.datasDaSemana[indice] === this.dataMinima
    );
  }

  numeroDoDia(indice: number): string {

    return this.datasDaSemana[indice].slice(8);
  }

  // =========================================
  // CALENDÁRIO MENSAL
  // =========================================

  get tituloMiniCalendario(): string {

    return this.mesReferencia.toLocaleDateString(
      'pt-BR',
      {
        month: 'long',
        year: 'numeric',
      }
    );
  }

  get quantidadeAgendamentosSemana(): number {

    return this.agendamentos.filter(item =>
      item.sala === this.form.sala &&
      item.status !== 'REJEITADO' &&
      this.datasDaSemana.includes(
        this.extrairApenasData(item.data)
      )
    ).length;
  }

  private atualizarMiniCalendario(): void {

    const ano = this.mesReferencia.getFullYear();
    const mes = this.mesReferencia.getMonth();

    const primeiroDiaDaGrade = this.segundaDe(
      new Date(ano, mes, 1)
    );

    const hoje = this.dataMinima;

    this.miniCalendario = Array.from(
      { length: 42 },
      (_, indice) => {

        const dia = this.somarDias(
          primeiroDiaDaGrade,
          indice
        );

        const data = this.paraIso(dia);

        return {
          data,
          numero: dia.getDate(),
          doMes: dia.getMonth() === mes,
          hoje: data === hoje,
          naSemana: this.datasDaSemana.includes(data),
        };
      }
    );
  }

  mudarMesMini(direcao: number): void {

    this.mesReferencia = new Date(
      this.mesReferencia.getFullYear(),
      this.mesReferencia.getMonth() + direcao,
      1
    );

    this.atualizarMiniCalendario();
  }

  selecionarDiaMini(data: string): void {

    this.irParaSemanaDe(data);
  }

  // =========================================
  // ABRIR E FECHAR FORMULÁRIO
  // =========================================

  abrirFormulario(
    data?: string,
    hora?: string
  ): void {

    if (this.enviandoSolicitacao) {
      return;
    }

    this.fecharSeletorHorario();

    const hoje = this.dataMinima;

    if (data && data < hoje) {

      this.mostrarAviso(
        'Não é possível reservar uma data passada.',
        'erro'
      );

      return;
    }

    if (data) {

      this.form.data = data;

    } else if (
      !this.form.data ||
      this.form.data < hoje
    ) {

      this.form.data =
        this.datasDaSemana.find(
          dia => dia >= hoje
        ) ?? hoje;
    }

    if (hora) {

      this.form.hora = hora;
      this.diaTodo = false;

    }

    this.ajustarHoraFim();

    this.mostrarFormulario = true;

    this.cdr.detectChanges();
  }

  fecharFormulario(): void {

    this.fecharSeletorHorario();

    this.mostrarFormulario = false;

    this.cdr.detectChanges();
  }

  // =========================================
  // NOTIFICAÇÕES
  // =========================================

  mostrarAviso(
    texto: string,
    tipo: 'sucesso' | 'erro' = 'sucesso'
  ): void {

    this.aviso = { texto, tipo };

    this.cdr.detectChanges();

    if (this.avisoTimer) {
      clearTimeout(this.avisoTimer);
    }

    this.avisoTimer = setTimeout(() => {

      this.aviso = null;

      this.cdr.detectChanges();

    }, 4000);
  }

  // =========================================
  // CARREGAR AGENDAMENTOS
  // =========================================

  async carregarAgendamentos(): Promise<boolean> {

    try {

      const response = await fetch(this.apiUrl, {
        cache: 'no-store'
      });

      if (!response.ok) {

        throw new Error(
          `Erro HTTP ${response.status} ao buscar agendamentos.`
        );
      }

      const lista = await response.json();

      if (!Array.isArray(lista)) {

        throw new Error(
          'Resposta inválida ao buscar agendamentos.'
        );
      }

      this.agendamentos = lista;

      this.dadosService.alterarAgendamentos(
        this.agendamentos.filter(
          agendamento =>
            agendamento.status !== 'REJEITADO'
        ).length
      );

      this.cdr.detectChanges();

      return true;

    } catch (error) {

      console.error(
        'Erro ao buscar agendamentos:',
        error
      );

      return false;
    }
  }

  private extrairApenasData(dataInput: any): string {

    if (!dataInput) {
      return '';
    }

    return String(dataInput)
      .split('T')[0]
      .trim();
  }

  // =========================================
  // VERIFICAR CONFLITOS
  // =========================================

  private horarioOcupado(
    data: string,
    hora: string,
    sala: string = this.form.sala
  ): boolean {

    return this.agendamentos.some(agendamento => {

      const salaMatch =
        agendamento.sala === sala;

      const dataMatch =
        this.extrairApenasData(agendamento.data) === data;

      const horaMatch =
        String(agendamento.hora).slice(0, 5) ===
        hora.slice(0, 5);

      const naoRejeitado =
        agendamento.status !== 'REJEITADO';

      return (
        salaMatch &&
        dataMatch &&
        horaMatch &&
        naoRejeitado
      );
    });
  }

  getAgendamentoSlot(
    dia: string,
    hora: string
  ) {

    const indice = this.diasSemana.indexOf(dia);

    if (indice === -1) {
      return undefined;
    }

    const dataAlvo = this.datasDaSemana[indice];

    return this.agendamentos.find(agendamento => {

      const salaMatch =
        agendamento.sala === this.form.sala;

      const dataMatch =
        this.extrairApenasData(agendamento.data) === dataAlvo;

      const horaMatch =
        String(agendamento.hora).slice(0, 5) ===
        hora.slice(0, 5);

      const naoRejeitado =
        agendamento.status !== 'REJEITADO';

      return (
        salaMatch &&
        dataMatch &&
        horaMatch &&
        naoRejeitado
      );
    });
  }

  // =========================================
  // VALIDAR A SOLICITAÇÃO
  // =========================================

  handleSubmit(): void {

    if (this.enviandoSolicitacao) {
      return;
    }

    this.fecharSeletorHorario();

    if (!this.intervaloValido) {

      this.mostrarAviso(
        'O horário de término deve ser posterior ao horário de início.',
        'erro'
      );

      return;
    }

    if (!this.form.data) {

      this.mostrarAviso(
        'Selecione uma data!',
        'erro'
      );

      return;
    }

    const hoje = this.dataMinima;

    if (
      this.tipoReserva === 'dia' &&
      this.form.data < hoje
    ) {

      this.mostrarAviso(
        'Não é possível reservar uma data passada.',
        'erro'
      );

      return;
    }

    const horasParaVerificar = this.horasSelecionadas;

    if (
      !this.form.sala ||
      horasParaVerificar.length === 0
    ) {

      this.mostrarAviso(
        'Selecione uma sala e um intervalo de horário válido.',
        'erro'
      );

      return;
    }

    // RESERVA DE 4 SEMANAS

    if (this.tipoReserva === 'mes') {

      const datas = this.datasDoMesDe(
        this.form.data
      ).filter(data => data >= hoje);

      if (datas.length === 0) {

        this.mostrarAviso(
          'O período selecionado já passou.',
          'erro'
        );

        return;
      }

      const ocupadas = datas.filter(data =>
        horasParaVerificar.some(hora =>
          this.horarioOcupado(data, hora)
        )
      );

      if (ocupadas.length > 0) {

        const lista = ocupadas
          .slice(0, 3)
          .map(data => this.formatarDataCurta(data))
          .join(', ');

        const mais =
          ocupadas.length > 3
            ? ` e mais ${ocupadas.length - 3} data(s)`
            : '';

        this.mostrarAviso(
          `Conflito: horário ocupado em ${lista}${mais}.`,
          'erro'
        );

        return;
      }

      this.datasParaAgendar = datas;

      this.periodoConfirmacao =
        `${this.formatarData(datas[0])} a ` +
        `${this.formatarData(datas[datas.length - 1])}`;

      this.diaConfirmacao =
        `${datas.length} dias úteis (4 semanas - Pendente)`;

      this.mostrarConfirmacao = true;
      this.mostrarFormulario = false;

      this.cdr.detectChanges();

      return;
    }

    // RESERVA SEMANAL

    if (this.tipoReserva === 'semana') {

      const datas = this.datasDaSemanaDe(
        this.form.data
      ).filter(data => data >= hoje);

      if (datas.length === 0) {

        this.mostrarAviso(
          'Essa semana já passou.',
          'erro'
        );

        return;
      }

      const ocupadas = datas.filter(data =>
        horasParaVerificar.some(hora =>
          this.horarioOcupado(data, hora)
        )
      );

      if (ocupadas.length > 0) {

        const lista = ocupadas
          .map(data => this.formatarDataCurta(data))
          .join(', ');

        this.mostrarAviso(
          `O horário já está ocupado em: ${lista}.`,
          'erro'
        );

        return;
      }

      this.datasParaAgendar = datas;

      this.periodoConfirmacao =
        `${this.formatarData(datas[0])} a ` +
        `${this.formatarData(datas[datas.length - 1])}`;

      this.diaConfirmacao = datas
        .map(data => this.obterDiaDaSemana(data))
        .join(', ');

      this.mostrarConfirmacao = true;
      this.mostrarFormulario = false;

      this.cdr.detectChanges();

      return;
    }

    // RESERVA DE DIA ÚNICO

    const diaSemana = this.obterDiaDaSemana(
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

    const horarioEstaOcupado =
      horasParaVerificar.some(hora =>
        this.horarioOcupado(this.form.data, hora)
      );

    if (horarioEstaOcupado) {

      this.mostrarAviso(
        `Um ou mais horários já estão ocupados em ` +
        `${this.formatarData(this.form.data)}!`,
        'erro'
      );

      return;
    }

    this.datasParaAgendar = [this.form.data];

    this.periodoConfirmacao =
      this.formatarData(this.form.data);

    this.diaConfirmacao = diaSemana;

    this.mostrarConfirmacao = true;
    this.mostrarFormulario = false;

    this.cdr.detectChanges();
  }

  // =========================================
  // VOLTAR AO FORMULÁRIO
  // =========================================

  cancelarConfirmacao(): void {

    if (this.enviandoSolicitacao) {
      return;
    }

    this.fecharSeletorHorario();

    this.mostrarConfirmacao = false;
    this.mostrarFormulario = true;

    this.diaConfirmacao = null;
    this.periodoConfirmacao = '';
    this.datasParaAgendar = [];

    this.cdr.detectChanges();
  }

  // =========================================
  // ENVIAR AO BACKEND NESTJS
  // =========================================

  async confirmarAgendamento(): Promise<void> {

    // Impede duplo clique e envio repetido.

    if (
      this.enviandoSolicitacao ||
      !this.mostrarConfirmacao
    ) {
      return;
    }

    this.enviandoSolicitacao = true;

    // Remove possíveis repetições de datas e horários.

    const datas = [...new Set(this.datasParaAgendar)];

    const sala = this.form.sala;
    const materia = this.form.materia.trim() || 'Agendado';
    const professor = this.nomeProfessor;

    const horasParaAgendar = [
      ...new Set(this.horasSelecionadas)
    ];

    if (
      !sala ||
      datas.length === 0 ||
      horasParaAgendar.length === 0
    ) {

      this.enviandoSolicitacao = false;

      this.mostrarAviso(
        'Selecione um intervalo válido.',
        'erro'
      );

      return;
    }

    this.cdr.detectChanges();

    // Atualiza os agendamentos antes de cadastrar.

    if (!(await this.carregarAgendamentos())) {

      this.enviandoSolicitacao = false;

      this.mostrarAviso(
        'Não foi possível verificar os horários. Tente novamente.',
        'erro'
      );

      return;
    }

    // Verifica novamente os horários ocupados.

    if (
      datas.some(data =>
        horasParaAgendar.some(hora =>
          this.horarioOcupado(data, hora, sala)
        )
      )
    ) {

      this.enviandoSolicitacao = false;

      this.cancelarConfirmacao();

      this.mostrarAviso(
        'Um ou mais horários já estão ocupados. Escolha outro intervalo.',
        'erro'
      );

      return;
    }

    const esperado =
      datas.length * horasParaAgendar.length;

    let criados = 0;
    let mensagemErroServidor = '';

    for (const data of datas) {

      for (const hora of horasParaAgendar) {

        try {

          const payload: any = {
            sala,
            data,
            hora,
            materia,
          };

          if (professor) {
            payload.professor = professor;
          }

          const response = await fetch(this.apiUrl, {

            method: 'POST',

            headers: {
              'Content-Type': 'application/json',
            },

            body: JSON.stringify(payload),

          });

          if (response.ok) {

            criados++;

          } else {

            const erroJson = await response
              .json()
              .catch(() => ({}));

            console.error(
              'Erro retornado pela API NestJS:',
              response.status,
              erroJson
            );

            mensagemErroServidor =
              Array.isArray(erroJson.message)
                ? erroJson.message.join('; ')
                : String(
                    erroJson.message ||
                    `Erro ${response.status} na API`
                  );
          }

        } catch (error) {

          console.error(
            'Erro de conexão com o servidor:',
            error
          );

          mensagemErroServidor =
            'Sem conexão com o servidor NestJS. ' +
            'Verifique a URL da API e o CORS.';

          break;
        }
      }

      if (mensagemErroServidor.startsWith('Sem conexão')) {
        break;
      }
    }

    if (criados === 0) {

      this.enviandoSolicitacao = false;

      this.mostrarAviso(
        mensagemErroServidor ||
        'Erro ao criar agendamento.',
        'erro'
      );

      return;
    }

    await this.carregarAgendamentos();

    this.mostrarConfirmacao = false;
    this.mostrarFormulario = false;
    this.enviandoSolicitacao = false;

    this.diaConfirmacao = null;
    this.periodoConfirmacao = '';
    this.datasParaAgendar = [];

    this.irParaSemanaDe(datas[0]);

    if (criados < esperado) {

      this.mostrarAviso(
        `Só ${criados} de ${esperado} horários ` +
        `foram solicitados. ${mensagemErroServidor}`,
        'erro'
      );

    } else {

      this.mostrarAviso(
        criados === 1
          ? 'Solicitação enviada! Aguardando aprovação do administrador.'
          : `${criados} solicitações enviadas! ` +
            'Aguardando aprovação do administrador.',
        'sucesso'
      );
    }

    this.agendamentoConcluido.emit();
  }
}
