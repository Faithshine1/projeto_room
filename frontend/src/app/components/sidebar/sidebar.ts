import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ActiveCategory = 'especiais' | 'laboratorios';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class SidebarComponent {
  @Input() activeCategory: ActiveCategory = 'especiais';
  @Output() categoryChange = new EventEmitter<ActiveCategory>();

  selectCategory(category: ActiveCategory): void {
    this.categoryChange.emit(category);
  }
}