export class CreateAgendamentoDto {
  sala: string;
  data: string; // Ex: '2026-10-06'
  hora: string; // Ex: '08:00'
  materia?: string;
}