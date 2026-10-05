import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent, ActiveCategory } from '../../components/sidebar/sidebar';
import { AgendaSemanalComponent } from '../../components/agenda-semanal/agenda-semanal';

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
  imports: [CommonModule, FormsModule, SidebarComponent, AgendaSemanalComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent {
  activeCategory: ActiveCategory = 'especiais';
  searchTerm: string = '';
  selectedRoom: Room | null = null;

  // Campos do formulário de agendamento
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

  get filteredRooms(): Room[] {
    // Se a categoria ativa for agendamentos, ignora a filtragem de salas
    if (this.activeCategory === 'agendamentos') {
      return [];
    }

    const targetType = this.activeCategory === 'especiais' ? 'ESPECIAL' : 'LABORATORIO';
    return this.rooms.filter(room => {
      const matchesCategory = room.type === targetType;
      const matchesSearch = room.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
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

  confirmBooking(): void {
    if (this.selectedRoomForBooking && this.selectedDate) {
      alert(`Agendamento realizado para a sala ${this.selectedRoomForBooking} no dia ${this.selectedDate} às ${this.selectedTime}`);
    }
  }
}
