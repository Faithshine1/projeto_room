import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
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
  erro = '';

  constructor(private router: Router) {}

  // Login do administrador: usuário ADMIN e senha ADMIN
  private ehAdmin(): boolean {
    return this.email.trim().toLowerCase() === 'admin' && this.senha === 'ADMIN';
  }

  entrar() {
    console.log('Botão Entrar clicado');

    // Admin é verificado ANTES das validações de e-mail (@) e tamanho de senha
    if (this.ehAdmin()) {
      this.erro = '';

      localStorage.setItem(
        'usuario',
        JSON.stringify({ nome: 'Administrador', email: 'admin', perfil: 'admin' })
      );

      this.router.navigate(['/admin']).then(sucesso => {
        if (!sucesso) {
          this.erro = 'Não foi possível abrir a área de administração.';
        }
      });
      return;
    }

    if (!this.email) {
      this.erro = 'Digite seu e-mail.';
      return;
    }

    if (!this.email.includes('@')) {
      this.erro = 'E-mail inválido!';
      return;
    }

    if (!this.senha) {
      this.erro = 'Digite sua senha.';
      return;
    }

    if (this.senha.length < 6) {
      this.erro =
        'Senha inválida. A senha deve conter no mínimo 6 caracteres.';
      return;
    }

    this.erro = '';

    const usuario = {
      nome: this.gerarNomeDoEmail(this.email),
      email: this.email
    };

    localStorage.setItem('usuario', JSON.stringify(usuario));

    this.router.navigate(['/dashboard']).then(sucesso => {
      console.log('Navegação para dashboard:', sucesso);

      if (!sucesso) {
        this.erro =
          'Não foi possível abrir o dashboard. Verifique as rotas.';
      }
    });
  }

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

  alternarSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }
}