import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EntradaDocument = HydratedDocument<Entrada>;

// Registro de cada entrada confirmada pela leitura do QR Code de uma sala
@Schema({ collection: 'entradas' })
export class Entrada {
  @Prop({ required: true })
  sala: string;

  // Data e hora da entrada em formato ISO
  @Prop({ required: true })
  horario: string;
}

export const EntradaSchema = SchemaFactory.createForClass(Entrada);
