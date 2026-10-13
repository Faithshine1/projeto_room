import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  email = '';
  senha = '';
  mostrarSenha = false;

  // Mensagem de erro exibida no formulário (no lugar do alert)
  erro = '';

  constructor(private router: Router) {}

  entrar() {

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
      this.erro = 'Senha inválida. A senha deve conter no mínimo 6 caracteres.';
      return;
    }

    this.erro = '';

    // Guarda o usuário para o dashboard mostrar o nome
    localStorage.setItem(
      'usuario',
      JSON.stringify({
        nome: this.gerarNomeDoEmail(this.email),
        email: this.email
      })
    );

    this.router.navigate(['/dashboard']);
  }

  // Transforma "maria.silva@gmail.com" em "Maria Silva"
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