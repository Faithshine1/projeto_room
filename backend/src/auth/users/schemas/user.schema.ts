import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

// GESTOR = acesso administrativo | PROFESSOR = acesso comum (consulta e solicita salas)
export type Perfil = 'GESTOR' | 'PROFESSOR';

@Schema({ timestamps: true, collection: 'usuarios' })
export class User {
  @Prop({ required: true, trim: true })
  nome: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  // select: false -> a senha (hash) não vem nas consultas comuns
  @Prop({ required: true, select: false })
  senha: string;

  @Prop({ required: true, enum: ['GESTOR', 'PROFESSOR'], default: 'PROFESSOR' })
  perfil: Perfil;

  @Prop({ default: true })
  ativo: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
