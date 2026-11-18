
import { CommonModule } from '@angular/common';
import {
  Component,
  ChangeDetectorRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {

  email = '';
  senha = '';

  mostrarSenha = false;
  carregando = false;
  mostrarRecuperacao = false;

  erro = '';

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // VERIFICAR ADMINISTRADOR
  // Mantém a lógica original do projeto.
  // Deve ser substituída por autenticação no backend.
  private ehAdmin(): boolean {
    return (
      this.email.trim().toLowerCase() === 'admin' &&
      this.senha === 'ADMIN'
    );
  }

  // REALIZAR LOGIN
  async entrar(): Promise<void> {

    if (this.carregando) return;

    this.erro = '';
    this.email = this.email.trim();

    // LOGIN ADMINISTRATIVO
    if (this.ehAdmin()) {

      await this.finalizarLogin(
        {
          nome: 'Administrador',
          email: 'admin',
          perfil: 'admin'
        },
        '/admin'
      );

      return;
    }

    // VALIDAR E-MAIL
    if (!this.email) {
      this.erro = 'Digite seu e-mail.';
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.erro = 'Informe um e-mail válido.';
      return;
    }

    // VALIDAR SENHA
    if (!this.senha) {
      this.erro = 'Digite sua senha.';
      return;
    }

    if (this.senha.length < 6) {
      this.erro =
        'A senha deve conter no mínimo 6 caracteres.';
      return;
    }

    // DADOS DO USUÁRIO
    const usuario = {
      nome: this.gerarNomeDoEmail(this.email),
      email: this.email
    };

    await this.finalizarLogin(
      usuario,
      '/dashboard'
    );
  }

  // SALVAR USUÁRIO E REDIRECIONAR
  private async finalizarLogin(
    usuario: {
      nome: string;
      email: string;
      perfil?: string;
    },
    rota: string
  ): Promise<void> {

    this.carregando = true;
    this.erro = '';

    try {

      localStorage.setItem(
        'usuario',
        JSON.stringify(usuario)
      );

      const sucesso = await this.router.navigate([rota]);

      if (!sucesso) {

        localStorage.removeItem('usuario');

        this.erro = rota === '/admin'
          ? 'Não foi possível abrir a área administrativa.'
          : 'Não foi possível abrir o dashboard.';

      }

    } catch (error) {

      console.error('Erro ao entrar:', error);

      localStorage.removeItem('usuario');

      this.erro =
        'Não foi possível acessar o sistema. Tente novamente.';

    } finally {

      this.carregando = false;
      this.cdr.markForCheck();

    }
  }

  // GERAR NOME A PARTIR DO E-MAIL
  gerarNomeDoEmail(email: string): string {

    const parteLocal = email.split('@')[0];

    const palavras = parteLocal
      .replace(/[0-9]/g, '')
      .split(/[._-]+/)
      .filter(palavra => palavra.length > 0);

    if (palavras.length === 0) {
      return 'Usuário';
    }

    return palavras
      .map(palavra =>
        palavra.charAt(0).toUpperCase() +
        palavra.slice(1).toLowerCase()
      )
      .join(' ');
  }

  // MOSTRAR OU OCULTAR SENHA
  alternarSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }

  // LIMPAR MENSAGEM DE ERRO
  limparErro(): void {
    this.erro = '';
  }

  // ABRIR INFORMAÇÕES DE RECUPERAÇÃO
  abrirRecuperacao(): void {
    this.mostrarRecuperacao = true;
  }

  // FECHAR RECUPERAÇÃO
  fecharRecuperacao(): void {
    this.mostrarRecuperacao = false;
  }
}
