
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import * as QRCode from 'qrcode';
import {SidebarComponent,ActiveCategory} from '../../components/sidebar/sidebar';
import {AgendaSemanalComponent} from '../../components/agenda-semanal/agenda-semanal';
import { MinhasReservasComponent} from '../../components/minhas-reservas/minhas-reservas';
import { Inicio } from '../../components/inicio/inicio';
import { LeitorQrComponent } from '../leitor-qr/leitor-qr';

// =====================================
// INTERFACES
// =====================================

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

interface SalaApi {
  id?: string;
  _id?: string;
  localizacao?: string;
  numero?: string;
  nome?: string;
  tipo?: string;
  status?: string;
  responsavel?: string;
}

// =====================================
// COMPONENTE DASHBOARD
// =====================================

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    AgendaSemanalComponent,
    MinhasReservasComponent,
    Inicio, LeitorQrComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})

export class DashboardComponent implements OnInit {

  // API DO BACKEND
  private readonly apiSalas = 'http://localhost:3001/admin/salas';

  // DADOS DO USUÁRIO
  nomeUsuario: string = 'Usuário';

  // NAVEGAÇÃO
  activeCategory: ActiveCategory = 'inicio';
  searchTerm: string = '';

  // CONTROLE DAS SALAS
  selectedRoom: Room | null = null;
  selectedRoomForBooking: string = '';
  selectedDate: string = '';
  selectedTime: string = '08:00';

  // LISTA DE SALAS
  rooms: Room[] = [];

  carregandoSalas = false;
  erroSalas = '';

  // CONTROLE DO QR CODE
  qrCodeDataUrl: string | null = null;
  roomForQr: Room | null = null;
  qrError = '';

  // =====================================
  // CONSTRUTOR
  // =====================================

  constructor(
    private router: Router,
    private http: HttpClient
  ) {

    if (typeof localStorage !== 'undefined') {

      const salvo = localStorage.getItem('usuario');

      if (salvo) {
        try {
          this.nomeUsuario =
            JSON.parse(salvo).nome || 'Usuário';

        } catch {
          this.nomeUsuario = 'Usuário';
        }
      }
    }
  }

  // =====================================
  // INICIALIZAÇÃO
  // =====================================

  ngOnInit(): void {
    this.carregarSalasDoBackend();
  }

  // =====================================
  // CARREGAR SALAS DO BACKEND
  // =====================================

  carregarSalasDoBackend(): void {

    this.carregandoSalas = true;
    this.erroSalas = '';

    this.http.get<SalaApi[]>(this.apiSalas).subscribe({

      next: (dados) => {

        const lista = Array.isArray(dados) ? dados : [];

        this.rooms = lista
          .map((item, index): Room => {

            const statusPermitidos: Room['status'][] = [
              'Disponível',
              'Ocupado',
              'Manutenção',
              'Reservado'
            ];

            const status = statusPermitidos.includes(
              item.status as Room['status']
            )
              ? item.status as Room['status']
              : 'Disponível';

            return {
              // IDENTIFICADOR REAL DO MONGODB
              id: String(item.id ?? item._id ?? ''),

              number: String(
                item.localizacao ??
                item.numero ??
                `00${index + 1}`
              ),

              name: String(item.nome ?? ''),

              type: item.tipo === 'LABORATORIO'
                ? 'LABORATORIO'
                : 'ESPECIAL',

              status,

              responsible: String(
                item.responsavel ?? 'Coordenação'
              )
            };
          })
          .filter(room => room.id !== '' && room.name !== '');

        this.carregandoSalas = false;
      },

      error: (erro) => {

        console.error('Erro ao carregar salas:', erro);

        this.rooms = [];
        this.erroSalas = 'Não foi possível carregar as salas.';
        this.carregandoSalas = false;
      }
    });
  }

  // =====================================
  // GERAR QR CODE
  // =====================================

  async gerarQrCode(room: Room): Promise<void> {

    this.roomForQr = room;
    this.qrCodeDataUrl = null;
    this.qrError = '';

    // VERIFICAR ID DA SALA
    if (!room.id) {

      this.qrError =
        'Esta sala não possui um identificador válido.';

      return;
    }

    // FORMATO ESPERADO PELO SALAS SERVICE
    const conteudo = `EDUROOM:${room.id}`;

    try {

      this.qrCodeDataUrl = await QRCode.toDataURL(
        conteudo,
        {
          width: 320,
          margin: 3,
          errorCorrectionLevel: 'M',

          color: {
            dark: '#281d65',
            light: '#ffffff'
          }
        }
      );

    } catch (erro) {

      console.error('Erro ao gerar QR Code:', erro);

      this.qrError =
        'Não foi possível gerar o QR Code.';
    }
  }

  // =====================================
  // FECHAR MODAL QR CODE
  // =====================================

  fecharQrCode(): void {

    this.roomForQr = null;
    this.qrCodeDataUrl = null;
    this.qrError = '';
  }

  // =====================================
  // SAIR DO SISTEMA
  // =====================================

  logout(): void {

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('usuario');
    }

    this.router.navigate(['/login']);
  }

  // =====================================
  // INICIAIS DO USUÁRIO
  // =====================================

  get iniciaisUsuario(): string {
    return this.iniciaisDe(this.nomeUsuario);
  }

  // =====================================
  // TÍTULO DA PÁGINA
  // =====================================

  get tituloPagina(): string {
  switch (this.activeCategory) {
    case 'especiais':
      return 'Salas Especiais';

    case 'laboratorios':
      return 'Laboratórios';

    case 'agendamentos':
      return 'Agendamentos';

    case 'minhas-reservas':
      return 'Minhas Reservas';

    case 'leitor-qr':
      return 'Leitor QR Code';

    default:
      return 'Painel';
  }
}
  // =====================================
  // SUBTÍTULO DA PÁGINA
  // =====================================

 get subtituloPagina(): string {
  switch (this.activeCategory) {
    case 'especiais':
      return 'Acompanhe o status e o responsável de cada sala.';

    case 'laboratorios':
      return 'Acompanhe o status e o responsável de cada laboratório.';

    case 'agendamentos':
      return 'Reserve um horário e veja a agenda da semana.';

    case 'minhas-reservas':
      return 'Consulte e filtre todos os seus agendamentos realizados.';

    case 'leitor-qr':
      return 'Confirme sua entrada escaneando o QR Code da sala.';

    default:
      return 'Resumo das suas salas e agendamentos.';
  }
}

  // =====================================
  // INICIAIS DOS NOMES
  // =====================================

  iniciaisDe(nome: string): string {

    const palavras = nome
      .replace(/^prof\.?\s+/i, '')
      .split(' ')
      .filter(palavra => palavra.length > 0);

    if (palavras.length === 0) {
      return '?';
    }

    return palavras
      .slice(0, 2)
      .map(palavra => palavra.charAt(0).toUpperCase())
      .join('');
  }

  // =====================================
  // FILTRAR SALAS
  // =====================================

  get filteredRooms(): Room[] {

    if (
      this.activeCategory === 'agendamentos' ||
      this.activeCategory === 'inicio' ||
      this.activeCategory === 'minhas-reservas'
    ) {
      return [];
    }

    const targetType =
      this.activeCategory === 'especiais'
        ? 'ESPECIAL'
        : 'LABORATORIO';

    return this.rooms.filter(room => {

      const matchesCategory =
        room.type === targetType;

      const termo = this.searchTerm.toLowerCase();

      const matchesSearch =
        room.name.toLowerCase().includes(termo) ||
        room.number.toLowerCase().includes(termo) ||
        room.responsible.toLowerCase().includes(termo);

      return matchesCategory && matchesSearch;
    });
  }

  // =====================================
  // NAVEGAÇÃO
  // =====================================

  setCategory(category: ActiveCategory): void {
    this.activeCategory = category;
  }

  // =====================================
  // STATUS DAS SALAS
  // =====================================

  getStatusClass(status: string): string {

    switch (status) {

      case 'Disponível':
        return 'status-available';

      case 'Ocupado':
        return 'status-occupied';

      case 'Manutenção':
        return 'status-maintenance';

      case 'Reservado':
        return 'status-reserved';

      default:
        return '';
    }
  }

  // =====================================
  // AÇÕES DAS SALAS
  // =====================================

  openActionModal(room: Room): void {
    this.selectedRoom = { ...room };
  }

  closeModal(): void {
    this.selectedRoom = null;
  }

  updateRoomStatus(
    newStatus: 'Disponível' | 'Ocupado' | 'Manutenção' | 'Reservado'
  ): void {

    if (this.selectedRoom) {

      const roomIndex = this.rooms.findIndex(
        room => room.id === this.selectedRoom?.id
      );

      if (roomIndex !== -1) {
        this.rooms[roomIndex].status = newStatus;
      }

      this.closeModal();
    }
  }
}

