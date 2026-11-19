import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export type Perfil = 'GESTOR' | 'PROFESSOR';

export interface UsuarioLogado {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
}

interface LoginResposta {
  token: string;
  usuario: UsuarioLogado;
}

const CHAVE_TOKEN = 'token';
const CHAVE_USUARIO = 'usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private plataforma = inject(PLATFORM_ID);

  private readonly api = `${environment.apiUrl.replace(/\/+$/, '')}/auth`;

  private get navegador(): boolean {
    return isPlatformBrowser(this.plataforma);
  }

  async login(email: string, password: string): Promise<UsuarioLogado> {
    const resposta = await firstValueFrom(
      this.http.post<LoginResposta>(`${this.api}/login`, { email, password }),
    );
    this.salvarSessao(resposta);
    return resposta.usuario;
  }

  sair(): void {
    if (!this.navegador) return;
    localStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_USUARIO);
  }

  // Cabeçalhos com o token, para chamadas feitas com fetch()
  cabecalhos(extra: Record<string, string> = {}): Record<string, string> {
    const token = this.token;
    return token ? { ...extra, Authorization: `Bearer ${token}` } : { ...extra };
  }

  get token(): string | null {
    if (!this.navegador) return null;
    return localStorage.getItem(CHAVE_TOKEN);
  }

  get usuario(): UsuarioLogado | null {
    if (!this.navegador) return null;
    try {
      return JSON.parse(localStorage.getItem(CHAVE_USUARIO) ?? 'null');
    } catch {
      return null;
    }
  }

  // Logado = tem token e ele ainda não expirou
  get logado(): boolean {
    const token = this.token;
    return !!token && !this.tokenExpirado(token) && !!this.usuario;
  }

  get ehGestor(): boolean {
    return this.logado && this.usuario?.perfil === 'GESTOR';
  }

  // Para onde ir depois do login
  rotaInicial(perfil: Perfil): string {
    return perfil === 'GESTOR' ? '/admin' : '/dashboard';
  }

  // Transforma o erro do backend (NestJS) em texto para a tela
  mensagemDeErro(erro: unknown): string {
    if (erro instanceof HttpErrorResponse) {
      if (erro.status === 0) return 'Não foi possível conectar ao servidor.';
      const msg = erro.error?.message;
      if (Array.isArray(msg)) return msg.join(' ');
      if (typeof msg === 'string') return msg;
    }
    return 'Ocorreu um erro. Tente novamente.';
  }

  private salvarSessao(resposta: LoginResposta): void {
    if (!this.navegador) return;
    localStorage.setItem(CHAVE_TOKEN, resposta.token);
    localStorage.setItem(CHAVE_USUARIO, JSON.stringify(resposta.usuario));
  }

  private tokenExpirado(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return typeof payload.exp === 'number' && payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}
