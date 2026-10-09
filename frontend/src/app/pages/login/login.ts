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

  constructor(private router: Router) {}

  entrar() {
    console.log('Botão Entrar funcionando');

    if (!this.email){
      alert('Digite seu e-mail.');
      return;
    }

    if (!this.email.includes('@')){
      alert('E-mail inválido!');
      return;
    }

    if (!this.senha) {
      alert('Digite sua senha.');
      return;
    }

    if (this.senha.length < 6){
      alert('Senha inválida. A senha deve conter no minimo 6 caracteres')
      return;
    }

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