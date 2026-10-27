
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SolicitacaoDocument =
  HydratedDocument<Solicitacao>;

@Schema({ timestamps: true, collection: 'solicitacoes' })
export class Solicitacao {
  @Prop({ required: true })
  nomeSala: string;

  @Prop({ required: true })
  solicitante: string;

  @Prop({ default: '' })
  justificativa: string;

  @Prop({
    required: true,
    enum: ['PENDENTE', 'APROVADA', 'RECUSADA'],
    default: 'PENDENTE',
  })
  status: string;

  @Prop({ default: () => new Date().toISOString() })
  criadaEm: string;
}

export const SolicitacaoSchema =
  SchemaFactory.createForClass(Solicitacao);
