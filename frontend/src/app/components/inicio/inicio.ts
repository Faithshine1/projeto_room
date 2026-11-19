
import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

import { DadosService } from '../../../Service/dados.service';
import { environment } from '../../../environments/environment';

interface ProximoAgendamento {
  sala: string;
  dia: string;
  hora: string;
  diaNumero: string;
  mes: string;
}

interface AgendamentoApi {
  sala?: string;
  data?: string;
  hora?: string;
  dia?: string;
  status?: string;
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnInit, OnDestroy {

  @Input() nomeUsuario: string = 'Usuário';

  quantidadeAgendamentos = 0;
  quantidadeSalas = 0;
  quantidadeLaboratorios = 0;

  proximoHorario = '--:--';
  proximaSala = 'Nenhum agendamento';

  proximosAgendamentos: ProximoAgendamento[] = [];

  carregandoAgendamentos = false;
  erroAgendamentos = '';

  private readonly subscriptions = new Subscription();

  private readonly apiUrl =
    `${environment.apiUrl.replace(/\/+$/, '')}/agendamentos`;

  private readonly auth = inject(AuthService);

  private readonly meses = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez'
  ];

  private readonly diasSemana = [
    'Domingo',
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado'
  ];

  constructor(
    private dadosService: DadosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.subscriptions.add(
      this.dadosService.agendamentos$.subscribe(
        (quantidade) => {
          this.quantidadeAgendamentos = quantidade;
          this.cdr.detectChanges();
        }
      )
    );

    this.subscriptions.add(
      this.dadosService.salasDisponiveis$.subscribe(
        (quantidade) => {
          this.quantidadeSalas = quantidade;
          this.cdr.detectChanges();
        }
      )
    );

    this.subscriptions.add(
      this.dadosService.laboratorios$.subscribe(
        (quantidade) => {
          this.quantidadeLaboratorios = quantidade;
          this.cdr.detectChanges();
        }
      )
    );

    void this.carregarAgendamentos();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // CONVERTE A DATA E O HORÁRIO PARA UMA DATA LOCAL
  private obterDataAgendamento(
    agendamento: AgendamentoApi
  ): Date | null {

    const data = String(agendamento.data ?? '')
      .slice(0, 10);

    const hora = String(agendamento.hora ?? '')
      .slice(0, 5);

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
      !/^\d{2}:\d{2}$/.test(hora)
    ) {
      return null;
    }

    const [ano, mes, dia] = data.split('-').map(Number);
    const [horas, minutos] = hora.split(':').map(Number);

    const resultado = new Date(
      ano,
      mes - 1,
      dia,
      horas,
      minutos
    );

    // Impede datas ou horários inválidos
    if (
      resultado.getFullYear() !== ano ||
      resultado.getMonth() !== mes - 1 ||
      resultado.getDate() !== dia ||
      resultado.getHours() !== horas ||
      resultado.getMinutes() !== minutos
    ) {
      return null;
    }

    return resultado;
  }

  // BUSCA AGENDAMENTOS DO BACKEND
  async carregarAgendamentos(): Promise<void> {

    this.carregandoAgendamentos = true;
    this.erroAgendamentos = '';

    try {
      const response = await fetch(this.apiUrl, {
        headers: this.auth.cabecalhos()
      });

      if (!response.ok) {
        throw new Error(
          `Erro ao buscar agendamentos: ${response.status}`
        );
      }

      const resposta: unknown = await response.json();

      if (!Array.isArray(resposta)) {
        throw new Error(
          'A API retornou um formato inesperado.'
        );
      }

      const agendamentos = resposta.filter(
        (item): item is AgendamentoApi =>
          item !== null &&
          typeof item === 'object' &&
          !Array.isArray(item)
      );

      // Mantém a regra original:
      // reservas rejeitadas não entram na contagem.
      const lista = agendamentos.filter(
        (agendamento) =>
          String(agendamento.status ?? '')
            .trim()
            .toUpperCase() !== 'REJEITADO'
      );

      this.dadosService.alterarAgendamentos(
        lista.length
      );

      const agora = Date.now();

      const futuros: {
        agendamento: AgendamentoApi;
        quando: Date;
      }[] = [];

      for (const agendamento of lista) {
        const quando = this.obterDataAgendamento(
          agendamento
        );

        if (
          quando &&
          quando.getTime() >= agora
        ) {
          futuros.push({
            agendamento,
            quando
          });
        }
      }

      // Organiza do horário mais próximo ao mais distante.
      futuros.sort(
        (a, b) =>
          a.quando.getTime() - b.quando.getTime()
      );

      this.proximosAgendamentos = futuros
        .slice(0, 5)
        .map(({ agendamento, quando }) => ({

          sala: String(
            agendamento.sala ?? 'Sala não informada'
          ),

          dia:
            agendamento.dia ||
            this.diasSemana[quando.getDay()],

          hora: String(agendamento.hora ?? '--:--')
            .slice(0, 5),

          diaNumero: String(
            quando.getDate()
          ).padStart(2, '0'),

          mes: this.meses[quando.getMonth()]

        }));

      // Próximo horário
      if (this.proximosAgendamentos.length > 0) {
        const proximo = this.proximosAgendamentos[0];

        this.proximoHorario = proximo.hora;
        this.proximaSala = proximo.sala;
      } else {
        this.proximoHorario = '--:--';
        this.proximaSala = 'Nenhum agendamento próximo';
      }

    } catch (error) {

      console.error(
        'Erro ao buscar agendamentos:',
        error
      );

      this.erroAgendamentos =
        'Não foi possível carregar os agendamentos.';

    } finally {

      this.carregandoAgendamentos = false;
      this.cdr.detectChanges();

    }
  }
}
