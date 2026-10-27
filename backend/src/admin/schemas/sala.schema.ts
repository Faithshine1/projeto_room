
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SalaDocument = HydratedDocument<Sala>;

@Schema({ timestamps: true, collection: 'salas' })
export class Sala {
  @Prop({ required: true, trim: true })
  nome: string;

  @Prop({ default: '' })
  localizacao: string;

  @Prop({ required: true, min: 1 })
  capacidade: number;

  @Prop({ type: [String], default: [] })
  recursos: string[];
}

export const SalaSchema = SchemaFactory.createForClass(Sala);
