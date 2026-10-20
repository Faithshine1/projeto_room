import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SidebarComponent, ActiveCategory } from '../../components/sidebar/sidebar';
import { AgendaSemanalComponent } from '../../components/agenda-semanal/agenda-semanal';
import { MinhasReservasComponent } from '../../components/minhas-reservas/minhas-reservas';
import { Inicio } from '../../components/inicio/inicio'; // <- Restaurado!

export interface Room {
  id: string;
  number: string;
  name: string;
  type: 'ESPECIAL' | 'LABORATORIO';
  status: 'Disponível' | 'Ocupado' | 'Manutenção' | 'Reservado';
  responsible: string;
}

export interface Booking {
  roomId: string;
  roomName: string;
  day: string;
  time: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    AgendaSemanalComponent,
    MinhasReservasComponent,
    Inicio
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {
  nomeUsuario: string = 'Usuário';
  activeCategory: ActiveCategory = 'inicio';
  searchTerm: string = '';
  selectedRoom: Room | null = null;
  selectedRoomForBooking: string = '';
  selectedDate: string = '';
  selectedTime: string = '08:00';

  rooms: Room[] = [
    { id: '1', number: '011', name: 'Sala de Informática 1', type: 'ESPECIAL', status: 'Disponível', responsible: 'Prof. Carlos' },
    { id: '2', number: '022', name: 'Sala de Informática 2', type: 'ESPECIAL', status: 'Ocupado', responsible: 'Prof. Ana' },
    { id: '3', number: '033', name: 'Sala de Vídeo', type: 'ESPECIAL', status: 'Manutenção', responsible: 'Suporte TI' },
    { id: '4', number: '044', name: 'Auditório', type: 'ESPECIAL', status: 'Reservado', responsible: 'Coordenação' },
    { id: '5', number: '055', name: 'Laboratório de Ciências', type: 'LABORATORIO', status: 'Disponível', responsible: 'Prof. Ricardo' }
  ];

  constructor(private router: Router) {
    if (typeof localStorage !== 'undefined') {
      const salvo = localStorage.getItem('usuario');
      if (salvo) {
        try {
          this.nomeUsuario = JSON.parse(salvo).nome || 'Usuário';
        } catch {
          this.nomeUsuario = 'Usuário';
        }
      }
    }
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('usuario');
    }
    this.router.navigate(['/login']);
  }

  get iniciaisUsuario(): string {
    return this.iniciaisDe(this.nomeUsuario);
  }

  get tituloPagina(): string {
    switch (this.activeCategory) {
      case 'especiais': return 'Salas Especiais';
      case 'laboratorios': return 'Laboratórios';
      case 'agendamentos': return 'Agendamentos';
      case 'minhas-reservas': return 'Minhas Reservas';
      default: return 'Painel';
    }
  }

  get subtituloPagina(): string {
    switch (this.activeCategory) {
      case 'especiais': return 'Acompanhe o status e o responsável de cada sala.';
      case 'laboratorios': return 'Acompanhe o status e o responsável de cada laboratório.';
      case 'agendamentos': return 'Reserve um horário e veja a agenda da semana.';
      case 'minhas-reservas': return 'Consulte e filtre todos os seus agendamentos realizados.';
      default: return 'Resumo das suas salas e agendamentos.';
    }
  }

  iniciaisDe(nome: string): string {
    const palavras = nome
      .replace(/^prof\.?\s+/i, '')
      .split(' ')
      .filter(palavra => palavra.length > 0);

    if (palavras.length === 0) {
      return '?';
    }

    return palavras.slice(0, 2).map(palavra => palavra.charAt(0).toUpperCase()).join('');
  }

  get filteredRooms(): Room[] {
    if (
      this.activeCategory === 'agendamentos' ||
      this.activeCategory === 'inicio' ||
      this.activeCategory === 'minhas-reservas'
    ) {
      return [];
    }

    const targetType = this.activeCategory === 'especiais' ? 'ESPECIAL' : 'LABORATORIO';

    return this.rooms.filter(room => {
      const matchesCategory = room.type === targetType;
      const matchesSearch =
        room.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        room.number.includes(this.searchTerm) ||
        room.responsible.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }

  setCategory(category: ActiveCategory): void {
    this.activeCategory = category;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Disponível': return 'status-available';
      case 'Ocupado': return 'status-occupied';
      case 'Manutenção': return 'status-maintenance';
      case 'Reservado': return 'status-reserved';
      default: return '';
    }
  }

  openActionModal(room: Room): void {
    this.selectedRoom = { ...room };
  }

  closeModal(): void {
    this.selectedRoom = null;
  }

  updateRoomStatus(newStatus: 'Disponível' | 'Ocupado' | 'Manutenção' | 'Reservado'): void {
    if (this.selectedRoom) {
      const roomIndex = this.rooms.findIndex(r => r.id === this.selectedRoom?.id);
      if (roomIndex !== -1) {
        this.rooms[roomIndex].status = newStatus;
      }
      this.closeModal();
    }
  }
}