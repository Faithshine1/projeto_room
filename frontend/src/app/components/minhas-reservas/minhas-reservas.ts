import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-minhas-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './minhas-reservas.html',
  styleUrl: './minhas-reservas.css'
})
export class MinhasReservasComponent implements OnInit {

  agendamentos: any[] = [];
  filtroSala: string = '';
  filtroStatus: string = '';
  buscaData: string = '';

  private apiUrl = 'http://localhost:3001/agendamentos';

  ngOnInit() {
    this.carregarAgendamentos();
  }

  async carregarAgendamentos() {
    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) throw new Error('Erro ao buscar agendamentos.');
      const dados = await response.json();

      this.agendamentos = dados.sort((a: any, b: any) => {
        const dataA = `${this.extrairApenasData(a.data)} ${a.hora}`;
        const dataB = `${this.extrairApenasData(b.data)} ${b.hora}`;
        return dataA.localeCompare(dataB);
      });
    } catch (error) {
      console.error('Erro ao carregar reservas:', error);
    }
  }

  private extrairApenasData(dataInput: any): string {
    if (!dataInput) return '';
    return String(dataInput).split('T')[0].trim();
  }

  formatarData(dataString: string): string {
    const limpa = this.extrairApenasData(dataString);
    if (!limpa) return '-';
    const [ano, mes, dia] = limpa.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  get agendamentosFiltrados() {
    return this.agendamentos.filter(a => {
      const matchSala = !this.filtroSala || a.sala?.toLowerCase().includes(this.filtroSala.toLowerCase());
      const matchStatus = !this.filtroStatus || a.status === this.filtroStatus;
      const matchData = !this.buscaData || this.extrairApenasData(a.data) === this.buscaData;
      return matchSala && matchStatus && matchData;
    });
  }

  limparFiltros() {
    this.filtroSala = '';
    this.filtroStatus = '';
    this.buscaData = '';
  }
}