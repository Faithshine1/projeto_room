
import { Component, OnInit } from '@angular/core';
import { DadosService } from '../../../Service/dados.service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnInit {
  nomeUsuario: string = 'TESTE123';

  quantidadeAgendamentos: number = 3;
  quantidadeSalas: number = 12;
  quantidadeLaboratorios: number = 5;

  proximoHorario: string = '08:00';
  proximaSala: string = 'Laboratório de Ciências';

  constructor(private dadosService: DadosService) {}

  ngOnInit(): void {

    this.dadosService.agendamentos$.subscribe((quantidade) => {
      this.quantidadeAgendamentos = quantidade;
    });

    this.dadosService.salasDisponiveis$.subscribe((quantidade) => {
      this.quantidadeSalas = quantidade;
    });

    this.dadosService.laboratorios$.subscribe((quantidade) => {
      this.quantidadeLaboratorios = quantidade;
    });

  }
}