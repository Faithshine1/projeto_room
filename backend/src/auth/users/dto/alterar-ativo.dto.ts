import { IsBoolean } from 'class-validator';

export class AlterarAtivoDto {
  @IsBoolean()
  ativo: boolean;
}
