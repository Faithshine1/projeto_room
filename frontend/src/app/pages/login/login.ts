
import { CommonModule } from '@angular/common';
import {
  Component,
  ChangeDetectorRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
    private cdr: ChangeDetectorRef,
    private auth: AuthService
  ) {}

  // REALIZAR LOGIN
  // O servidor confere e-mail e senha e devolve o perfil:
  // GESTOR vai para /admin e PROFESSOR vai para /dashboard.
  async entrar(): Promise<void> {

    if (this.carregando) return;

    this.erro = '';
    this.email = this.email.trim();

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

    this.carregando = true;

    try {

      const usuario = await this.auth.login(
        this.email,
        this.senha
      );

      const sucesso = await this.router.navigate([
        this.auth.rotaInicial(usuario.perfil)
      ]);

      if (!sucesso) {
        this.auth.sair();
        this.erro = 'Não foi possível abrir o sistema.';
      }

    } catch (error) {

      this.erro = this.auth.mensagemDeErro(error);

    } finally {

      this.carregando = false;
      this.cdr.markForCheck();

    }
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
