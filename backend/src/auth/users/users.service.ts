import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';
import { Model } from 'mongoose';

import { CreateUserDto } from './dto/criar.conta.dto.js';
import { Perfil, User, UserDocument } from './schemas/user.schema.js';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly config: ConfigService,
  ) {}

  // Cria o primeiro GESTOR a partir do .env (GESTOR_EMAIL, GESTOR_SENHA, GESTOR_NOME)
  async onModuleInit() {
    const email = this.config.get<string>('GESTOR_EMAIL');
    const senha = this.config.get<string>('GESTOR_SENHA');
    if (!email || !senha) return;

    const existe = await this.userModel.exists({ email: email.toLowerCase() });
    if (existe) return;

    await this.criar(
      {
        nome: this.config.get<string>('GESTOR_NOME') ?? 'Gestor',
        email,
        password: senha,
      },
      'GESTOR',
    );
    this.logger.log(`Gestor inicial criado: ${email}`);
  }

  // O perfil é sempre definido pelo servidor, nunca vem do cliente
  async criar(dto: CreateUserDto, perfil: Perfil) {
    const senhaHash = await bcrypt.hash(dto.password, 10);
    try {
      const usuario = await this.userModel.create({
        nome: dto.nome,
        email: dto.email,
        senha: senhaHash,
        perfil,
      });
      return {
        id: usuario.id as string,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
      };
    } catch (erro: unknown) {
      if ((erro as { code?: number }).code === 11000) {
        throw new ConflictException('E-mail já cadastrado.');
      }
      throw erro;
    }
  }

  // Usado no login: traz a senha (hash), que normalmente fica oculta
  buscarPorEmailComSenha(email: string) {
    return this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+senha')
      .exec();
  }

  async listar() {
    const lista = await this.userModel.find().sort({ nome: 1 }).exec();
    return lista.map((u) => this.paraDto(u));
  }

  async alterarAtivo(id: string, ativo: boolean) {
    if (!/^[a-f\d]{24}$/i.test(id)) {
      throw new BadRequestException('ID do usuário inválido.');
    }
    const usuario = await this.userModel
      .findByIdAndUpdate(id, { ativo }, { new: true })
      .exec();
    if (!usuario) throw new NotFoundException('Usuário não encontrado.');
    return this.paraDto(usuario);
  }

  private paraDto(u: UserDocument) {
    return {
      id: u.id as string,
      nome: u.nome,
      email: u.email,
      perfil: u.perfil,
      ativo: u.ativo,
    };
  }

  buscarPorId(id: string) {
    return this.userModel.findById(id).exec();
  }
}
