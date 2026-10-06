import { Component } from '@angular/core';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio {

  quantidadeAgendamentos = 3;

  quantidadeSalas = 12;

  quantidadeLaboratorios = 5;

  proximoHorario = '08:00';

  proximaSala = 'Laboratório de Ciências';

}