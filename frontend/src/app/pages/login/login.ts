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

    this.router.navigate(['/dashboard']);
  }

  alternarSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }
}