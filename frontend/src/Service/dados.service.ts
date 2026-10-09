import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DadosService {

  private agendamentos = new BehaviorSubject<number>(3);
  agendamentos$ = this.agendamentos.asObservable();

  private salasDisponiveis = new BehaviorSubject<number>(12);
  salasDisponiveis$ = this.salasDisponiveis.asObservable();

  private laboratorios = new BehaviorSubject<number>(5);
  laboratorios$ = this.laboratorios.asObservable();

  alterarAgendamentos(quantidade: number) {
    this.agendamentos.next(quantidade);
  }

  alterarSalasDisponiveis(quantidade: number) {
    this.salasDisponiveis.next(quantidade);
  }

  alterarLaboratorios(quantidade: number) {
    this.laboratorios.next(quantidade);
  }

  getAgendamentos() {
    return this.agendamentos.value;
  }

  adicionarAgendamento() {
    this.agendamentos.next(this.agendamentos.value + 1);
  }
}

