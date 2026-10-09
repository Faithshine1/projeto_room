import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { OnInit } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { DadosService } from '../../../Service/dados.service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnInit {
  @Input() nomeUsuario: string = 'Usuário';

  quantidadeAgendamentos: number = 3;
  quantidadeSalas: number = 12;
  quantidadeLaboratorios: number = 5;

  proximoHorario: string = '08:00';
  proximaSala: string = 'Laboratório de Ciências';

  private apiUrl = 'http://localhost:3001/agendamentos';

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

    this.carregarTotalAgendamentos();
  }

  async carregarTotalAgendamentos() {
    try {
      const response = await fetch(this.apiUrl);

      if (!response.ok) {
        throw new Error('Erro ao buscar agendamentos.');
      }

      const lista = await response.json();

      // Atualiza o service; o subscribe acima atualiza o card
      this.dadosService.alterarAgendamentos(lista.length);

    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    }
  }
}