
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

type Secao = 'inicio' | 'salas' | 'solicitacoes' | 'usuarios';

type StatusSolicitacao =
  | 'PENDENTE'
  | 'APROVADA'
  | 'RECUSADA';

interface Sala {
  id: string;
  nome: string;
  localizacao: string;
  capacidade: number;
  recursos: string[];
}

interface Solicitacao {
  id: string;
  nomeSala: string;
  solicitante: string;
  justificativa: string;
  status: StatusSolicitacao;
  criadaEm: string;
  data: string;
  hora: string;
}

interface AgendamentoApi {
  id: string;
  sala: string;
  materia: string;
  data: string;
  hora: string;
  status: 'PENDENTE' | 'APROVADO' | 'REJEITADO';
  professor: string;
  criadaEm: string;
}

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: 'GESTOR' | 'PROFESSOR';
  ativo: boolean;
}

interface Dashboard {
  totalSalas: number;
  pendentes: number;
  aprovadas: number;
  recusadas: number;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {

  private readonly api =
    `${environment.apiUrl.replace(/\/+$/, '')}/admin`;

  private readonly apiAgendamentos =
    `${environment.apiUrl.replace(/\/+$/, '')}/agendamentos`;

  private readonly apiUsuarios =
    `${environment.apiUrl.replace(/\/+$/, '')}/auth/usuarios`;

  @ViewChild('modalSala', { static: true })
  modalSala!: ElementRef<HTMLDialogElement>;

  @ViewChild('modalUsuario', { static: true })
  modalUsuario!: ElementRef<HTMLDialogElement>;

  secao: Secao = 'inicio';

  carregando = false;
  cadastrandoSala = false;
  removendoSalas = false;
  processandoSolicitacao: string | null = null;

  salasCarregadas = false;
  solicitacoesCarregadas = false;

  mensagem = '';
  erro = '';
  erroSalas = '';
  erroSolicitacoes = '';
  erroModal = '';

  nomeAdministrador = 'Administrador';

  pesquisaSala = '';
  pesquisaSolicitacao = '';

  filtroStatus: StatusSolicitacao | 'TODAS' = 'TODAS';

  salas: Sala[] = [];
  solicitacoes: Solicitacao[] = [];
  salasSelecionadas: string[] = [];

  dashboard: Dashboard = {
    totalSalas: 0,
    pendentes: 0,
    aprovadas: 0,
    recusadas: 0,
  };

  novaSala = {
    nome: '',
    localizacao: '',
    capacidade: 30,
    recursosTexto: '',
  };

  // Usuários (contas criadas pelo gestor)
  usuarios: Usuario[] = [];
  usuariosCarregados = false;
  erroUsuarios = '';
  erroModalUsuario = '';
  pesquisaUsuario = '';
  salvandoUsuario = false;
  processandoUsuario: string | null = null;

  novoUsuario: {
    nome: string;
    email: string;
    password: string;
    perfil: 'GESTOR' | 'PROFESSOR';
  } = {
    nome: '',
    email: '',
    password: '',
    perfil: 'PROFESSOR'
  };

  graficoSemana: {
    dia: string;
    quantidade: number;
    altura: number;
  }[] = [];

  private readonly auth = inject(AuthService);

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarAdministrador();
    this.atualizarGrafico();
    void this.carregarDados();
    void this.carregarUsuarios();
  }

  // ==========================================
  // ADMINISTRADOR
  // ==========================================

  private carregarAdministrador(): void {
    try {
      const salvo = localStorage.getItem('usuario');

      if (salvo) {
        const usuario = JSON.parse(salvo);

        this.nomeAdministrador =
          usuario.nome || 'Administrador';
      }
    } catch {
      this.nomeAdministrador = 'Administrador';
    }
  }

  get iniciaisAdministrador(): string {
    return this.nomeAdministrador
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(nome => nome.charAt(0).toUpperCase())
      .join('') || 'AD';
  }

  sair(): void {
    const confirmar = window.confirm(
      'Deseja sair do painel administrativo?'
    );

    if (!confirmar) return;

    this.auth.sair();

    void this.router.navigate(['/login']);
  }

  // ==========================================
  // NAVEGAÇÃO
  // ==========================================

  get tituloPagina(): string {
    switch (this.secao) {
      case 'salas':
        return 'Gerenciar salas';

      case 'usuarios':
        return 'Gerenciar usuários';

      case 'solicitacoes':
        return 'Solicitações de reservas';

      default:
        return 'Visão geral';
    }
  }

  get subtituloPagina(): string {
    switch (this.secao) {
      case 'salas':
        return 'Cadastre e organize os espaços da instituição.';

      case 'usuarios':
        return 'Crie as contas de professores e gestores.';

      case 'solicitacoes':
        return 'Acompanhe, aprove ou recuse os pedidos de reserva.';

      default:
        return 'Acompanhe os principais indicadores da instituição.';
    }
  }

  mudarSecao(secao: Secao): void {
    this.secao = secao;
    this.mensagem = '';
    this.erro = '';
    this.filtroStatus = 'TODAS';
    this.pesquisaSolicitacao = '';
    this.pesquisaSala = '';
    this.salasSelecionadas = [];
    this.pesquisaUsuario = '';

    if (secao === 'usuarios') {
      void this.carregarUsuarios();
    }
  }

  abrirSolicitacoes(
    status: StatusSolicitacao | 'TODAS' = 'TODAS'
  ): void {
    this.mudarSecao('solicitacoes');
    this.filtroStatus = status;
  }

  // ==========================================
  // CARREGAR DADOS DO BACKEND
  // ==========================================

  async carregarDados(): Promise<void> {
    if (this.carregando) return;

    this.carregando = true;
    this.erroSalas = '';
    this.erroSolicitacoes = '';

    const [salasResultado, solicitacoesResultado] =
      await Promise.allSettled([
        firstValueFrom(
          this.http.get<Sala[]>(`${this.api}/salas`)
        ),
        firstValueFrom(
          this.http.get<AgendamentoApi[]>(
            this.apiAgendamentos
          )
        ),
      ]);

    if (
      salasResultado.status === 'fulfilled' &&
      Array.isArray(salasResultado.value)
    ) {
      this.salas = salasResultado.value.map(sala => ({
        ...sala,
        recursos: Array.isArray(sala.recursos)
          ? sala.recursos
          : []
      }));

      this.salasCarregadas = true;

      this.salasSelecionadas =
        this.salasSelecionadas.filter(id =>
          this.salas.some(sala => sala.id === id)
        );

    } else {
      this.erroSalas =
        'Não foi possível carregar as salas. Verifique a conexão com o backend.';
    }

    if (
      solicitacoesResultado.status === 'fulfilled' &&
      Array.isArray(solicitacoesResultado.value)
    ) {
      this.solicitacoes = this.ordenar(
        solicitacoesResultado.value.map(
          agendamento => this.paraSolicitacao(agendamento)
        )
      );

      this.solicitacoesCarregadas = true;

    } else {
      this.erroSolicitacoes =
        'Não foi possível carregar as solicitações de reserva.';
    }

    this.atualizarResumo();
    this.atualizarGrafico();

    this.carregando = false;

    this.cdr.markForCheck();
  }

  // ==========================================
  // CONVERSÃO E ORGANIZAÇÃO
  // ==========================================

  private paraSolicitacao(
    agendamento: AgendamentoApi
  ): Solicitacao {

    const data = String(agendamento.data || '').slice(0, 10);
    const hora = String(agendamento.hora || '').slice(0, 5);

    const detalhe = agendamento.materia
      ? ` · ${agendamento.materia}`
      : '';

    return {
      id: agendamento.id,

      nomeSala: agendamento.sala,

      solicitante: agendamento.professor || 'Professor',

      justificativa:
        `Reserva para ${this.formatarData(data)} às ${hora}${detalhe}`,

      status:
        agendamento.status === 'APROVADO'
          ? 'APROVADA'
          : agendamento.status === 'REJEITADO'
            ? 'RECUSADA'
            : 'PENDENTE',

      criadaEm: agendamento.criadaEm,
      data,
      hora
    };
  }

  formatarData(data: string): string {
    const resultado = /^(\d{4})-(\d{2})-(\d{2})/.exec(data);

    if (!resultado) return data || 'Não informada';

    return `${resultado[3]}/${resultado[2]}/${resultado[1]}`;
  }

  private ordenar(lista: Solicitacao[]): Solicitacao[] {
    const peso = (s: Solicitacao) =>
      s.status === 'PENDENTE' ? 0 : 1;

    return [...lista].sort((a, b) =>
      peso(a) - peso(b) ||
      (b.criadaEm || '').localeCompare(a.criadaEm || '')
    );
  }

  private atualizarResumo(): void {
    const contar = (status: StatusSolicitacao) =>
      this.solicitacoes.filter(
        solicitacao => solicitacao.status === status
      ).length;

    this.dashboard = {
      totalSalas: this.salas.length,
      pendentes: contar('PENDENTE'),
      aprovadas: contar('APROVADA'),
      recusadas: contar('RECUSADA')
    };
  }

  // ==========================================
  // GRÁFICOS
  // ==========================================

  get totalReservas(): number {
    return this.solicitacoes.length;
  }

  get totalSemana(): number {
    return this.graficoSemana.reduce(
      (total, dia) => total + dia.quantidade,
      0
    );
  }

  private dataLocal(data: Date): string {
    const ano = data.getFullYear();

    const mes = String(
      data.getMonth() + 1
    ).padStart(2, '0');

    const dia = String(
      data.getDate()
    ).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  private atualizarGrafico(): void {
    const dias = [
      'Seg', 'Ter', 'Qua', 'Qui',
      'Sex', 'Sáb', 'Dom'
    ];

    const segunda = new Date();

    segunda.setHours(0, 0, 0, 0);

    const deslocamento =
      (segunda.getDay() + 6) % 7;

    segunda.setDate(
      segunda.getDate() - deslocamento
    );

    const dados = dias.map((dia, indice) => {
      const data = new Date(segunda);

      data.setDate(segunda.getDate() + indice);

      const dataFormatada = this.dataLocal(data);

      const quantidade = this.solicitacoes.filter(
        solicitacao => solicitacao.data === dataFormatada
      ).length;

      return {
        dia,
        quantidade,
        altura: 0
      };
    });

    const maior = Math.max(
      1,
      ...dados.map(item => item.quantidade)
    );

    this.graficoSemana = dados.map(item => ({
      ...item,
      altura: (item.quantidade / maior) * 100
    }));
  }

  percentual(quantidade: number): number {
    if (!this.totalReservas) return 0;

    return Math.round(
      quantidade / this.totalReservas * 100
    );
  }

  get graficoStatus(): string {
    if (!this.totalReservas) {
      return '#ece8f3';
    }

    const aprovadas =
      this.dashboard.aprovadas / this.totalReservas * 100;

    const pendentes =
      this.dashboard.pendentes / this.totalReservas * 100;

    return `conic-gradient(
      #22a66b 0% ${aprovadas}%,
      #e9a83b ${aprovadas}% ${aprovadas + pendentes}%,
      #e45368 ${aprovadas + pendentes}% 100%
    )`;
  }

  get solicitacoesRecentes(): Solicitacao[] {
    return this.solicitacoes.slice(0, 5);
  }

  // ==========================================
  // PESQUISA E FILTROS
  // ==========================================

  private normalizar(texto: string): string {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  get salasFiltradas(): Sala[] {
    const termo = this.normalizar(this.pesquisaSala);

    if (!termo) return this.salas;

    return this.salas.filter(sala => {
      const texto = [
        sala.nome,
        sala.localizacao,
        sala.capacidade,
        ...(sala.recursos || [])
      ].join(' ');

      return this.normalizar(texto).includes(termo);
    });
  }

  get solicitacoesFiltradas(): Solicitacao[] {
    const termo = this.normalizar(
      this.pesquisaSolicitacao
    );

    return this.solicitacoes.filter(solicitacao => {
      const statusCorreto =
        this.filtroStatus === 'TODAS' ||
        solicitacao.status === this.filtroStatus;

      const texto = [
        solicitacao.nomeSala,
        solicitacao.solicitante,
        solicitacao.justificativa,
        solicitacao.id
      ].join(' ');

      return statusCorreto &&
        this.normalizar(texto).includes(termo);
    });
  }

  selecionarStatus(
    status: StatusSolicitacao | 'TODAS'
  ): void {
    this.filtroStatus = status;
  }

  limparPesquisaSala(): void {
    this.pesquisaSala = '';
    this.salasSelecionadas = [];
  }

  limparFiltrosSolicitacoes(): void {
    this.pesquisaSolicitacao = '';
    this.filtroStatus = 'TODAS';
  }

  // ==========================================
  // MODAL DE CADASTRO DE SALAS
  // ==========================================

  abrirModalSala(): void {
    this.erroModal = '';
    this.mensagem = '';
    this.erro = '';

    this.novaSala = {
      nome: '',
      localizacao: '',
      capacidade: 30,
      recursosTexto: ''
    };

    this.modalSala.nativeElement.showModal();
  }

  fecharModalSala(): void {
    if (this.cadastrandoSala) return;

    this.modalSala.nativeElement.close();
    this.erroModal = '';
  }

  cancelarModal(evento: Event): void {
    if (this.cadastrandoSala) {
      evento.preventDefault();
    }
  }

  async criarSala(): Promise<void> {
    if (this.cadastrandoSala || this.carregando) return;

    this.erroModal = '';
    this.mensagem = '';
    this.erro = '';

    const nome = this.novaSala.nome.trim();

    if (!nome) {
      this.erroModal = 'Informe o nome da sala.';
      return;
    }

    if (
      !Number.isInteger(this.novaSala.capacidade) ||
      this.novaSala.capacidade < 1
    ) {
      this.erroModal =
        'Informe uma capacidade inteira maior que zero.';

      return;
    }

    const recursos = [
      ...new Set(
        this.novaSala.recursosTexto
          .split(',')
          .map(recurso => recurso.trim())
          .filter(Boolean)
      )
    ];

    this.cadastrandoSala = true;

    try {
      await firstValueFrom(
        this.http.post<Sala>(
          `${this.api}/salas`,
          {
            nome,
            localizacao: this.novaSala.localizacao.trim(),
            capacidade: this.novaSala.capacidade,
            recursos
          }
        )
      );

      this.mudarSecao('salas');

      this.mensagem = 'Sala cadastrada com sucesso!';

      this.modalSala.nativeElement.close();

      await this.carregarDados();

    } catch (error) {
      this.erroModal = this.obterMensagemErro(
        error,
        'Não foi possível cadastrar a sala.'
      );

    } finally {
      this.cadastrandoSala = false;
      this.cdr.markForCheck();
    }
  }

  // ==========================================
  // USUÁRIOS (somente o gestor cria as contas)
  // ==========================================

  get meuId(): string {
    return this.auth.usuario?.id ?? '';
  }

  get usuariosFiltrados(): Usuario[] {
    const termo = this.normalizar(this.pesquisaUsuario);

    if (!termo) return this.usuarios;

    return this.usuarios.filter(usuario =>
      this.normalizar(
        `${usuario.nome} ${usuario.email} ${usuario.perfil}`
      ).includes(termo)
    );
  }

  async carregarUsuarios(): Promise<void> {
    this.erroUsuarios = '';

    try {
      const lista = await firstValueFrom(
        this.http.get<Usuario[]>(this.apiUsuarios)
      );

      this.usuarios = Array.isArray(lista) ? lista : [];
      this.usuariosCarregados = true;

    } catch (error) {
      this.erroUsuarios = this.obterMensagemErro(
        error,
        'Não foi possível carregar os usuários.'
      );
    }

    this.cdr.markForCheck();
  }

  abrirModalUsuario(): void {
    this.erroModalUsuario = '';
    this.mensagem = '';
    this.erro = '';

    this.novoUsuario = {
      nome: '',
      email: '',
      password: '',
      perfil: 'PROFESSOR'
    };

    this.modalUsuario.nativeElement.showModal();
  }

  fecharModalUsuario(): void {
    if (this.salvandoUsuario) return;

    this.modalUsuario.nativeElement.close();
    this.erroModalUsuario = '';
  }

  cancelarModalUsuario(evento: Event): void {
    if (this.salvandoUsuario) {
      evento.preventDefault();
    }
  }

  async criarUsuario(): Promise<void> {
    if (this.salvandoUsuario) return;

    this.erroModalUsuario = '';
    this.mensagem = '';
    this.erro = '';

    const nome = this.novoUsuario.nome.trim();
    const email = this.novoUsuario.email.trim();
    const { password, perfil } = this.novoUsuario;

    if (nome.length < 2) {
      this.erroModalUsuario = 'Informe o nome do usuário.';
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.erroModalUsuario = 'Informe um e-mail válido.';
      return;
    }

    if (password.length < 8) {
      this.erroModalUsuario =
        'A senha deve ter no mínimo 8 caracteres.';
      return;
    }

    this.salvandoUsuario = true;

    try {
      await firstValueFrom(
        this.http.post(this.apiUsuarios, {
          nome,
          email,
          password,
          perfil
        })
      );

      this.modalUsuario.nativeElement.close();
      this.mudarSecao('usuarios');

      this.mensagem =
        `Conta de ${perfil === 'GESTOR' ? 'gestor' : 'professor'} criada! ` +
        'Passe o e-mail e a senha provisória para a pessoa.';

    } catch (error) {
      this.erroModalUsuario = this.obterMensagemErro(
        error,
        'Não foi possível criar a conta.'
      );

    } finally {
      this.salvandoUsuario = false;
      this.cdr.markForCheck();
    }
  }

  async alternarAtivo(usuario: Usuario): Promise<void> {
    if (this.processandoUsuario) return;

    if (usuario.ativo) {
      const confirmar = window.confirm(
        `Desativar a conta de ${usuario.nome}? Ela não poderá mais entrar no sistema.`
      );

      if (!confirmar) return;
    }

    this.mensagem = '';
    this.erro = '';
    this.processandoUsuario = usuario.id;

    try {
      await firstValueFrom(
        this.http.patch(
          `${this.apiUsuarios}/${usuario.id}/ativo`,
          { ativo: !usuario.ativo }
        )
      );

      await this.carregarUsuarios();

    } catch (error) {
      this.erro = this.obterMensagemErro(
        error,
        'Não foi possível alterar o usuário.'
      );

    } finally {
      this.processandoUsuario = null;
      this.cdr.markForCheck();
    }
  }

  // ==========================================
  // SELEÇÃO DE SALAS
  // ==========================================

  get todasSelecionadas(): boolean {
    return this.salasFiltradas.length > 0 &&
      this.salasFiltradas.every(
        sala => this.salasSelecionadas.includes(sala.id)
      );
  }

  estaSelecionada(id: string): boolean {
    return this.salasSelecionadas.includes(id);
  }

  alternarSelecao(id: string): void {
    if (this.removendoSalas) return;

    this.salasSelecionadas = this.estaSelecionada(id)
      ? this.salasSelecionadas.filter(item => item !== id)
      : [...this.salasSelecionadas, id];
  }

  alternarTodas(): void {
    if (this.removendoSalas) return;

    const visiveis = this.salasFiltradas.map(
      sala => sala.id
    );

    if (this.todasSelecionadas) {
      this.salasSelecionadas =
        this.salasSelecionadas.filter(
          id => !visiveis.includes(id)
        );
    } else {
      this.salasSelecionadas = [
        ...new Set([
          ...this.salasSelecionadas,
          ...visiveis
        ])
      ];
    }
  }

  // ==========================================
  // REMOVER SALAS
  // ==========================================

  async removerSala(sala: Sala): Promise<void> {
    if (this.removendoSalas || this.carregando) return;

    const confirmar = window.confirm(
      `Deseja remover a sala "${sala.nome}"?\n\n` +
      'Confirme se ela possui reservas antes de continuar.'
    );

    if (!confirmar) return;

    this.mensagem = '';
    this.erro = '';
    this.removendoSalas = true;

    try {
      await firstValueFrom(
        this.http.delete(
          `${this.api}/salas/${encodeURIComponent(sala.id)}`
        )
      );

      this.salas = this.salas.filter(
        item => item.id !== sala.id
      );

      this.salasSelecionadas =
        this.salasSelecionadas.filter(
          id => id !== sala.id
        );

      this.mensagem = `Sala "${sala.nome}" removida.`;

      await this.carregarDados();

    } catch (error) {
      this.erro = this.obterMensagemErro(
        error,
        'Não foi possível remover a sala.'
      );

    } finally {
      this.removendoSalas = false;
      this.atualizarResumo();
      this.cdr.markForCheck();
    }
  }

  async removerSelecionadas(): Promise<void> {
    const ids = [...this.salasSelecionadas];

    if (
      this.removendoSalas ||
      this.carregando ||
      ids.length === 0
    ) return;

    const confirmar = window.confirm(
      `Remover ${ids.length} sala(s) selecionada(s)?\n\n` +
      'Confirme se existem reservas vinculadas antes de continuar.'
    );

    if (!confirmar) return;

    this.mensagem = '';
    this.erro = '';
    this.removendoSalas = true;

    const removidas: string[] = [];
    const falhas: string[] = [];

    for (const id of ids) {
      try {
        await firstValueFrom(
          this.http.delete(
            `${this.api}/salas/${encodeURIComponent(id)}`
          )
        );

        removidas.push(id);

      } catch {
        falhas.push(id);
      }
    }

    this.salas = this.salas.filter(
      sala => !removidas.includes(sala.id)
    );

    this.salasSelecionadas = falhas;

    if (falhas.length === 0) {
      this.mensagem =
        `${removidas.length} sala(s) removida(s).`;
    } else {
      this.erro =
        `${removidas.length} sala(s) removida(s). ` +
        `${falhas.length} não puderam ser removidas.`;
    }

    await this.carregarDados();

    this.removendoSalas = false;
    this.atualizarResumo();
    this.cdr.markForCheck();
  }

  // ==========================================
  // APROVAR OU RECUSAR SOLICITAÇÕES
  // ==========================================

  async analisarSolicitacao(
    id: string,
    acao: 'aprovar' | 'recusar'
  ): Promise<void> {
    if (
      this.processandoSolicitacao ||
      this.carregando
    ) return;

    const solicitacao = this.solicitacoes.find(
      item => item.id === id
    );

    if (
      !solicitacao ||
      solicitacao.status !== 'PENDENTE'
    ) return;

    const confirmar = window.confirm(
      `Deseja ${acao} a reserva de "${solicitacao.nomeSala}"?`
    );

    if (!confirmar) return;

    this.mensagem = '';
    this.erro = '';
    this.processandoSolicitacao = id;

    try {
      await firstValueFrom(
        this.http.patch(
          `${this.apiAgendamentos}/${encodeURIComponent(id)}/${acao}`,
          {}
        )
      );

      this.solicitacoes = this.ordenar(
        this.solicitacoes.map(item =>
          item.id === id
            ? {
                ...item,
                status: acao === 'aprovar'
                  ? 'APROVADA'
                  : 'RECUSADA'
              }
            : item
        )
      );

      this.mensagem = acao === 'aprovar'
        ? 'Reserva aprovada com sucesso!'
        : 'Reserva recusada com sucesso!';

      await this.carregarDados();

    } catch (error) {
      this.erro = this.obterMensagemErro(
        error,
        'Não foi possível atualizar a reserva.'
      );

    } finally {
      this.processandoSolicitacao = null;
      this.atualizarResumo();
      this.cdr.markForCheck();
    }
  }

  // ==========================================
  // TRATAMENTO DE ERROS
  // ==========================================

  private obterMensagemErro(
    error: unknown,
    padrao: string
  ): string {
    const resposta = error as {
      status?: number;
      error?: {
        message?: string | string[];
      };
    };

    if (resposta?.status === 0) {
      return 'Não foi possível conectar ao backend.';
    }

    const mensagem = resposta?.error?.message;

    if (Array.isArray(mensagem)) {
      return mensagem.join(' ');
    }

    return typeof mensagem === 'string'
      ? mensagem
      : padrao;
  }

  trackById(
    _index: number,
    item: { id: string }
  ): string {
    return item.id;
  }
}
