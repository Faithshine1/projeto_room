
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export type ActiveCategory =
  | 'inicio'
  | 'especiais'
  | 'laboratorios'
  | 'agendamentos'
  | 'minhas-reservas';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent {
  @Input() activeCategory: ActiveCategory = 'inicio';

  @Output() categoryChange = new EventEmitter<ActiveCategory>();

  isMobileMenuOpen = false;

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  selectCategory(category: ActiveCategory): void {
    this.categoryChange.emit(category);
    this.closeMobileMenu();
  }
}
