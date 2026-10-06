import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ActiveCategory =
  | 'inicio'
  | 'especiais'
  | 'laboratorios'
  | 'agendamentos';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent {

  @Input() activeCategory: ActiveCategory = 'inicio';

  @Output() categoryChange = new EventEmitter<ActiveCategory>();

  selectCategory(category: ActiveCategory): void {
    this.categoryChange.emit(category);
  }

}