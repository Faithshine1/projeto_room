import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AgendamentoDocument = HydratedDocument<Agendamento>;

export type StatusAgendamento = 'PENDENTE' | 'APROVADO' | 'REJEITADO';

@Schema({ timestamps: true, collection: 'agendamentos' })
export class Agendamento {
  @Prop({ required: true, trim: true })
  sala: string;

  @Prop({ default: 'Agendado' })
  materia: string;

  // Dia da semana por extenso (Segunda, Terça...)
  @Prop({ required: true })
  dia: string;

  // Formato AAAA-MM-DD
  @Prop({ required: true })
  data: string;

  // Formato HH:MM
  @Prop({ required: true })
  hora: string;

  // Toda reserva nasce PENDENTE e só o admin muda isso
  @Prop({
    required: true,
    enum: ['PENDENTE', 'APROVADO', 'REJEITADO'],
    default: 'PENDENTE',
  })
  status: string;

  @Prop({ default: 'Professor' })
  professor: string;

  @Prop({ default: () => new Date().toISOString() })
  criadaEm: string;
}

export const AgendamentoSchema = SchemaFactory.createForClass(Agendamento);
