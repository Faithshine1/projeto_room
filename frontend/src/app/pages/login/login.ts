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

    this.router.navigate(['/dashboard']);
  }

  alternarSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }
}