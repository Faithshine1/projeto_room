import {
  Component,
  OnInit,
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
export class AgendaSemanalComponent implements OnInit {
  @Output() agendamentoConcluido = new EventEmitter<void>();

  diasSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];

  horarios = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '17:00'];

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
    hora: '08:00',
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

  private avisoTimer: ReturnType<typeof setTimeout> | undefined;

  // Remove barras finais para evitar URLs com barras duplicadas.
  private readonly baseApiUrl = environment.apiUrl.replace(/\/+$/, '');

  private readonly apiUrl = `${this.baseApiUrl}/agendamentos`;
  private readonly apiSalas = `${this.baseApiUrl}/salas`;

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

  async carregarSalas(): Promise<void> {
    try {
      const response = await fetch(this.apiSalas);

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status} ao buscar salas.`);
      }

      const lista: any[] = await response.json();
      const todas = [...this.salasPadrao];

      for (const sala of lista) {
        const nome = String(sala?.nome ?? '').trim();

        const jaExiste = todas.some(
          (nomeExistente) =>
            nomeExistente.toLowerCase() === nome.toLowerCase(),
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

    return new Date(Number(ano), Number(mes) - 1, Number(dia));
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
      data.getDate(),
    );

    const deslocamento = (copia.getDay() + 6) % 7;
    copia.setDate(copia.getDate() - deslocamento);

    return copia;
  }

  private datasDaSemanaDe(dataString: string): string[] {
    const segunda = this.segundaDe(this.deIso(dataString));

    return [0, 1, 2, 3, 4].map((i) =>
      this.paraIso(this.somarDias(segunda, i)),
    );
  }

  private datasDoMesDe(dataString: string): string[] {
    const segundaInicial = this.segundaDe(this.deIso(dataString));
    const datas: string[] = [];

    for (let semana = 0; semana < 4; semana++) {
      for (let dia = 0; dia < 5; dia++) {
        datas.push(
          this.paraIso(
            this.somarDias(segundaInicial, semana * 7 + dia),
          ),
        );
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

  private definirSemana(segunda: Date): void {
    this.semanaInicio = segunda;

    this.datasDaSemana = [0, 1, 2, 3, 4].map((i) =>
      this.paraIso(this.somarDias(segunda, i)),
    );

    this.rotuloSemana = `${this.formatarDataCurta(
      this.datasDaSemana[0],
    )} – ${this.formatarDataCurta(this.datasDaSemana[4])}`;
  }

  semanaAnterior(): void {
    this.definirSemana(this.somarDias(this.semanaInicio, -7));
  }

  proximaSemana(): void {
    this.definirSemana(this.somarDias(this.semanaInicio, 7));
  }

  irParaHoje(): void {
    this.definirSemana(this.segundaDe(new Date()));
  }

  private irParaSemanaDe(dataString: string): void {
    this.definirSemana(this.segundaDe(this.deIso(dataString)));
  }

  ehHoje(indice: number): boolean {
    return this.datasDaSemana[indice] === this.dataMinima;
  }

  numeroDoDia(indice: number): string {
    return this.datasDaSemana[indice].slice(8);
  }

  mostrarAviso(
    texto: string,
    tipo: 'sucesso' | 'erro' = 'sucesso',
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

  async carregarAgendamentos(): Promise<void> {
    try {
      const response = await fetch(this.apiUrl);

      if (!response.ok) {
        throw new Error(
          `Erro HTTP ${response.status} ao buscar agendamentos.`,
        );
      }

      this.agendamentos = await response.json();

      this.dadosService.alterarAgendamentos(
        this.agendamentos.filter((agendamento) =>
          agendamento.status !== 'REJEITADO',
        ).length,
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
    return this.agendamentos.some((agendamento) => {
      const salaMatch = agendamento.sala === this.form.sala;
      const dataMatch =
        this.extrairApenasData(agendamento.data) === data;
      const horaMatch =
        String(agendamento.hora).slice(0, 5) === hora.slice(0, 5);
      const naoRejeitado = agendamento.status !== 'REJEITADO';

      return salaMatch && dataMatch && horaMatch && naoRejeitado;
    });
  }

  getAgendamentoSlot(dia: string, hora: string) {
    const indice = this.diasSemana.indexOf(dia);

    if (indice === -1) return undefined;

    const dataAlvo = this.datasDaSemana[indice];

    return this.agendamentos.find((agendamento) => {
      const salaMatch = agendamento.sala === this.form.sala;
      const dataMatch =
        this.extrairApenasData(agendamento.data) === dataAlvo;
      const horaMatch =
        String(agendamento.hora).slice(0, 5) === hora.slice(0, 5);
      const naoRejeitado = agendamento.status !== 'REJEITADO';

      return salaMatch && dataMatch && horaMatch && naoRejeitado;
    });
  }

  handleSubmit(): void {
    if (!this.form.data) {
      this.mostrarAviso('Selecione uma data!', 'erro');
      return;
    }

    const hoje = this.dataMinima;

    const horasParaVerificar =
      this.form.hora === 'todos' ? this.horarios : [this.form.hora];

    if (this.tipoReserva === 'mes') {
      const datas = this.datasDoMesDe(this.form.data).filter(
        (data) => data >= hoje,
      );

      if (datas.length === 0) {
        this.mostrarAviso('O período selecionado já passou.', 'erro');
        return;
      }

      const ocupadas = datas.filter((data) =>
        horasParaVerificar.some((hora) =>
          this.horarioOcupado(data, hora),
        ),
      );

      if (ocupadas.length > 0) {
        const lista = ocupadas
          .slice(0, 3)
          .map((data) => this.formatarDataCurta(data))
          .join(', ');

        const mais =
          ocupadas.length > 3
            ? ` e mais ${ocupadas.length - 3} data(s)`
            : '';

        this.mostrarAviso(
          `Conflito: horário ocupado em ${lista}${mais}.`,
          'erro',
        );

        return;
      }

      this.datasParaAgendar = datas;

      this.periodoConfirmacao = `${this.formatarData(
        datas[0],
      )} a ${this.formatarData(datas[datas.length - 1])}`;

      this.diaConfirmacao = `${datas.length} dias úteis (4 semanas - Pendente)`;
      this.mostrarConfirmacao = true;
      this.cdr.detectChanges();

      return;
    }

    if (this.tipoReserva === 'semana') {
      const datas = this.datasDaSemanaDe(this.form.data).filter(
        (data) => data >= hoje,
      );

      if (datas.length === 0) {
        this.mostrarAviso('Essa semana já passou.', 'erro');
        return;
      }

      const ocupadas = datas.filter((data) =>
        horasParaVerificar.some((hora) =>
          this.horarioOcupado(data, hora),
        ),
      );

      if (ocupadas.length > 0) {
        const lista = ocupadas
          .map((data) => this.formatarDataCurta(data))
          .join(', ');

        this.mostrarAviso(
          `O horário já está ocupado em: ${lista}.`,
          'erro',
        );

        return;
      }

      this.datasParaAgendar = datas;

      this.periodoConfirmacao = `${this.formatarData(
        datas[0],
      )} a ${this.formatarData(datas[datas.length - 1])}`;

      this.diaConfirmacao = datas
        .map((data) => this.obterDiaDaSemana(data))
        .join(', ');

      this.mostrarConfirmacao = true;
      this.cdr.detectChanges();

      return;
    }

    const diaSemana = this.obterDiaDaSemana(this.form.data);

    if (diaSemana === 'Sábado' || diaSemana === 'Domingo') {
      this.mostrarAviso(
        'Agendamentos apenas de Segunda a Sexta!',
        'erro',
      );
      return;
    }

    const horarioEstaOcupado = horasParaVerificar.some((hora) =>
      this.horarioOcupado(this.form.data, hora),
    );

    if (horarioEstaOcupado) {
      this.mostrarAviso(
        `Um ou mais horários já estão ocupados em ${this.formatarData(
          this.form.data,
        )}!`,
        'erro',
      );
      return;
    }

    this.datasParaAgendar = [this.form.data];
    this.periodoConfirmacao = this.formatarData(this.form.data);
    this.diaConfirmacao = diaSemana;
    this.mostrarConfirmacao = true;
    this.cdr.detectChanges();
  }

  cancelarConfirmacao(): void {
    this.mostrarConfirmacao = false;
    this.diaConfirmacao = null;
    this.periodoConfirmacao = '';
    this.datasParaAgendar = [];

    this.cdr.detectChanges();
  }

  async confirmarAgendamento(): Promise<void> {
    const datas = [...this.datasParaAgendar];
    const sala = this.form.sala;

    const horasParaAgendar =
      this.form.hora === 'todos' ? this.horarios : [this.form.hora];

    const esperado = datas.length * horasParaAgendar.length;

    let criados = 0;
    let mensagemErroServidor = '';

    for (const data of datas) {
      for (const hora of horasParaAgendar) {
        try {
          const payload: any = {
            sala,
            data,
            hora,
            materia: 'Agendado',
          };

          if (this.nomeProfessor) {
            payload.professor = this.nomeProfessor;
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
            const erroJson = await response.json().catch(() => ({}));

            console.error(
              'Erro retornado pela API NestJS:',
              response.status,
              erroJson,
            );

            mensagemErroServidor =
              erroJson.message || `Erro ${response.status} na API`;
          }
        } catch (error) {
          console.error('Erro de conexão com o servidor:', error);

          mensagemErroServidor =
            'Sem conexão com o servidor NestJS. Verifique a URL da API e o CORS.';

          break;
        }
      }

      if (mensagemErroServidor.startsWith('Sem conexão')) {
        break;
      }
    }

    if (criados === 0) {
      this.mostrarAviso(
        mensagemErroServidor || 'Erro ao criar agendamento.',
        'erro',
      );

      return;
    }

    await this.carregarAgendamentos();

    this.mostrarConfirmacao = false;
    this.diaConfirmacao = null;
    this.periodoConfirmacao = '';
    this.datasParaAgendar = [];

    this.irParaSemanaDe(datas[0]);

    if (criados < esperado) {
      this.mostrarAviso(
        `Só ${criados} de ${esperado} horários foram solicitados. ${mensagemErroServidor}`,
        'erro',
      );
    } else {
      this.mostrarAviso(
        criados === 1
          ? 'Solicitação enviada! Aguardando aprovação do administrador.'
          : `${criados} solicitações enviadas! Aguardando aprovação do administrador.`,
        'sucesso',
      );
    }

    this.agendamentoConcluido.emit();
  }
}
