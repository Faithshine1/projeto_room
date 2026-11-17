
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import * as QRCode from 'qrcode';

import {
  SidebarComponent,
  ActiveCategory,
} from '../../components/sidebar/sidebar';

import {
  AgendaSemanalComponent,
} from '../../components/agenda-semanal/agenda-semanal';

import {
  MinhasReservasComponent,
} from '../../components/minhas-reservas/minhas-reservas';

import { Inicio } from '../../components/inicio/inicio';
import { LeitorQrComponent } from '../leitor-qr/leitor-qr';

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
  id?: string | number;
  _id?: string;
  localizacao?: string | number;
  numero?: string | number;
  nome?: string;
  name?: string;
  tipo?: string;
  type?: string;
  status?: string;
  responsavel?: string;
  responsible?: string;
}

type FiltroStatusSala =
  | 'TODAS'
  | 'Disponível'
  | 'Ocupado'
  | 'Manutenção'
  | 'Reservado';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    AgendaSemanalComponent,
    MinhasReservasComponent,
    Inicio,
    LeitorQrComponent,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {

  // API ORIGINAL
  private readonly apiSalas =
    'http://localhost:3001/admin/salas';

  // USUÁRIO
  nomeUsuario: string = 'Usuário';

  // NAVEGAÇÃO E FILTROS
  activeCategory: ActiveCategory = 'inicio';
  searchTerm: string = '';
  filtroStatusSala: FiltroStatusSala = 'TODAS';

  // CONTROLE DAS SALAS
  selectedRoom: Room | null = null;
  selectedRoomForBooking: string = '';
  selectedDate: string = '';
  selectedTime: string = '08:00';

  // DADOS
  rooms: Room[] = [];
  carregandoSalas = false;
  erroSalas = '';

  // SALAS ILUSTRATIVAS DO PROJETO ORIGINAL
  private readonly salasIlustrativas: Room[] = [
    {
      id: 'demo-011',
      number: '011',
      name: 'Sala de Informática 1',
      type: 'ESPECIAL',
      status: 'Disponível',
      responsible: 'Prof. Carlos',
    },
    {
      id: 'demo-200',
      number: '200',
      name: 'Sala de Reuniões',
      type: 'ESPECIAL',
      status: 'Ocupado',
      responsible: 'Coordenação',
    },
    {
      id: 'demo-201',
      number: '201',
      name: 'Sala Multimídia',
      type: 'ESPECIAL',
      status: 'Disponível',
      responsible: 'Prof. João',
    },
    {
      id: 'demo-055',
      number: '055',
      name: 'Laboratório de Ciências',
      type: 'LABORATORIO',
      status: 'Manutenção',
      responsible: 'Prof. Ricardo',
    },
  ];

  // QR CODE
  qrCodeDataUrl: string | null = null;
  roomForQr: Room | null = null;
  qrError = '';

  constructor(
    private router: Router,
    private http: HttpClient,
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

  ngOnInit(): void {
    this.carregarSalasDoBackend();
  }

  // EXTRAI A LISTA RETORNADA PELA API
  private extrairListaSalas(dados: unknown): SalaApi[] {
    if (Array.isArray(dados)) {
      return dados as SalaApi[];
    }

    if (dados && typeof dados === 'object') {
      const resposta = dados as {
        salas?: unknown;
        data?: unknown;
        results?: unknown;
        items?: unknown;
      };

      if (Array.isArray(resposta.salas)) {
        return resposta.salas as SalaApi[];
      }

      if (Array.isArray(resposta.data)) {
        return resposta.data as SalaApi[];
      }

      if (Array.isArray(resposta.results)) {
        return resposta.results as SalaApi[];
      }

      if (Array.isArray(resposta.items)) {
        return resposta.items as SalaApi[];
      }
    }

    return [];
  }

  // NORMALIZA STATUS
  normalizarStatus(
    status: string | undefined
  ): Room['status'] {

    const valor = String(status ?? '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[_-]+/g, ' ');

    switch (valor) {
      case 'DISPONIVEL':
      case 'LIVRE':
      case 'AVAILABLE':
        return 'Disponível';

      case 'OCUPADO':
      case 'OCUPADA':
      case 'OCCUPIED':
        return 'Ocupado';

      case 'MANUTENCAO':
      case 'EM MANUTENCAO':
      case 'MAINTENANCE':
        return 'Manutenção';

      case 'RESERVADO':
      case 'RESERVADA':
      case 'RESERVED':
        return 'Reservado';

      default:
        return 'Disponível';
    }
  }

  // NORMALIZA O TIPO DO ESPAÇO
  private normalizarTipo(
    tipo: string | undefined
  ): Room['type'] {

    const valor = String(tipo ?? '')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

    return valor === 'LABORATORIO'
      ? 'LABORATORIO'
      : 'ESPECIAL';
  }

  // CARREGA SALAS DO BACKEND
  carregarSalasDoBackend(): void {
    this.carregandoSalas = true;
    this.erroSalas = '';

    this.http.get<unknown>(this.apiSalas).subscribe({
      next: (dados) => {
        const lista = this.extrairListaSalas(dados);

        this.rooms = lista
          .map((item, index): Room => ({
            id: String(item.id ?? item._id ?? ''),

            number: String(
              item.localizacao ??
              item.numero ??
              `00${index + 1}`
            ),

            name: String(
              item.nome ??
              item.name ??
              ''
            ),

            type: this.normalizarTipo(
              item.tipo ?? item.type
            ),

            status: this.normalizarStatus(
              item.status
            ),

            responsible: String(
              item.responsavel ??
              item.responsible ??
              'Coordenação'
            ),
          }))
          .filter(room => room.name.trim() !== '');

        // MANTÉM O COMPORTAMENTO ORIGINAL
        if (this.rooms.length === 0) {
          this.rooms = this.salasIlustrativas.map(
            room => ({ ...room })
          );
        }

        this.erroSalas = '';
        this.carregandoSalas = false;

        console.log('Salas carregadas:', this.rooms);
      },

      error: (erro) => {
        console.error('Erro ao carregar salas:', erro);

        // FALLBACK ILUSTRATIVO ORIGINAL
        this.rooms = this.salasIlustrativas.map(
          room => ({ ...room })
        );

        this.erroSalas = '';
        this.carregandoSalas = false;
      },
    });
  }

  // GERA QR CODE
  async gerarQrCode(room: Room): Promise<void> {
    this.roomForQr = room;
    this.qrCodeDataUrl = null;
    this.qrError = '';

    if (!room.id || room.id.startsWith('demo-')) {
      this.qrError =
        'Esta sala é ilustrativa e não possui QR Code válido para entrada.';
      return;
    }

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
            light: '#ffffff',
          },
        }
      );
    } catch (erro) {
      console.error('Erro ao gerar QR Code:', erro);

      this.qrError =
        'Não foi possível gerar o QR Code.';
    }
  }

  fecharQrCode(): void {
    this.roomForQr = null;
    this.qrCodeDataUrl = null;
    this.qrError = '';
  }

  // AUTENTICAÇÃO
  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('usuario');
    }

    this.router.navigate(['/login']);
  }

  // DADOS DO USUÁRIO
  get iniciaisUsuario(): string {
    return this.iniciaisDe(this.nomeUsuario);
  }

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

  // INICIAIS DOS NOMES
  iniciaisDe(nome: string): string {
    const palavras = (nome || '')
      .replace(/^prof\.?\s+/i, '')
      .trim()
      .split(/\s+/)
      .filter(palavra => palavra.length > 0);

    if (palavras.length === 0) {
      return '?';
    }

    return palavras
      .slice(0, 2)
      .map(palavra => palavra.charAt(0).toUpperCase())
      .join('');
  }

  // SALAS DA CATEGORIA ATUAL
  get roomsDaCategoria(): Room[] {
    if (
      this.activeCategory !== 'especiais' &&
      this.activeCategory !== 'laboratorios'
    ) {
      return [];
    }

    const tipo: Room['type'] =
      this.activeCategory === 'especiais'
        ? 'ESPECIAL'
        : 'LABORATORIO';

    return this.rooms.filter(
      room => room.type === tipo
    );
  }

  // CONTADORES
  contarSalas(status: FiltroStatusSala): number {
    if (status === 'TODAS') {
      return this.roomsDaCategoria.length;
    }

    return this.roomsDaCategoria.filter(
      room => room.status === status
    ).length;
  }

  // FILTRAGEM
  get filteredRooms(): Room[] {
    const termo = this.searchTerm.trim().toLowerCase();

    return this.roomsDaCategoria.filter(room => {
      const correspondeStatus =
        this.filtroStatusSala === 'TODAS' ||
        room.status === this.filtroStatusSala;

      const correspondeBusca =
        room.name.toLowerCase().includes(termo) ||
        room.number.toLowerCase().includes(termo) ||
        room.responsible.toLowerCase().includes(termo);

      return correspondeStatus && correspondeBusca;
    });
  }

  // NAVEGAÇÃO
  setCategory(category: ActiveCategory): void {
    this.activeCategory = category;
    this.filtroStatusSala = 'TODAS';
    this.searchTerm = '';
  }

  setFiltroStatusSala(status: FiltroStatusSala): void {
    this.filtroStatusSala = status;
  }

  // ESTILOS DE STATUS
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

  // AÇÕES
  openActionModal(room: Room): void {
    this.selectedRoom = { ...room };
  }

  closeModal(): void {
    this.selectedRoom = null;
  }

  updateRoomStatus(
    newStatus:
      | 'Disponível'
      | 'Ocupado'
      | 'Manutenção'
      | 'Reservado'
  ): void {
    if (!this.selectedRoom) {
      return;
    }

    const roomId = this.selectedRoom.id;

    this.rooms = this.rooms.map(room =>
      room.id === roomId
        ? { ...room, status: newStatus }
        : room
    );

    this.closeModal();
  }
}
