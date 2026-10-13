import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { OnInit } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { DadosService } from '../../../Service/dados.service';

interface ProximoAgendamento {
  sala: string;
  dia: string;
  hora: string;
  diaNumero: string;
  mes: string;
}

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnInit {
  @Input() nomeUsuario: string = 'Usuário';

  quantidadeAgendamentos: number = 0;
  quantidadeSalas: number = 12;
  quantidadeLaboratorios: number = 5;

  proximoHorario: string = '--:--';
  proximaSala: string = 'Nenhum agendamento';

  proximosAgendamentos: ProximoAgendamento[] = [];

  private apiUrl = 'http://localhost:3001/agendamentos';

  private meses = [
    'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez'
  ];

  private diasSemana = [
    'Domingo', 'Segunda', 'Terça', 'Quarta',
    'Quinta', 'Sexta', 'Sábado'
  ];

  constructor(
    private dadosService: DadosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.dadosService.agendamentos$.subscribe((quantidade) => {
      this.quantidadeAgendamentos = quantidade;
      this.cdr.detectChanges();
    });

    this.dadosService.salasDisponiveis$.subscribe((quantidade) => {
      this.quantidadeSalas = quantidade;
      this.cdr.detectChanges();
    });

    this.dadosService.laboratorios$.subscribe((quantidade) => {
      this.quantidadeLaboratorios = quantidade;
      this.cdr.detectChanges();
    });

    this.carregarAgendamentos();
  }

  async carregarAgendamentos() {
    try {
      const response = await fetch(this.apiUrl);

      if (!response.ok) {
        throw new Error('Erro ao buscar agendamentos.');
      }

      const lista: any[] = await response.json();

      // Atualiza o service; o subscribe acima atualiza o card
      this.dadosService.alterarAgendamentos(lista.length);

      const agora = new Date().getTime();

      // Próximos agendamentos: só os que ainda não passaram, do mais perto ao mais longe
      this.proximosAgendamentos = lista
        .map((a: any) => ({
          a,
          quando: new Date(`${a.data}T${a.hora}:00`)
        }))
        .filter((x: any) =>
          !isNaN(x.quando.getTime()) &&
          x.quando.getTime() >= agora
        )
        .sort((x: any, y: any) =>
          x.quando.getTime() - y.quando.getTime()
        )
        .slice(0, 5)
        .map((x: any) => ({
          sala: x.a.sala,
          dia: x.a.dia || this.diasSemana[x.quando.getDay()],
          hora: x.a.hora,
          diaNumero: String(x.quando.getDate()).padStart(2, '0'),
          mes: this.meses[x.quando.getMonth()]
        }));

      if (this.proximosAgendamentos.length > 0) {
        this.proximoHorario = this.proximosAgendamentos[0].hora;
        this.proximaSala = this.proximosAgendamentos[0].sala;
      } else {
        this.proximoHorario = '--:--';
        this.proximaSala = 'Nenhum agendamento';
      }

      this.cdr.detectChanges();

    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    }
  }
}