# 🏫 EduRoom

O **EduRoom** é um sistema web para o **gerenciamento de salas**, com interface moderna e arquitetura separada entre **frontend** e **backend**. Ele permite visualizar a agenda das salas, fazer reservas, acompanhar as próprias reservas e conta com um painel administrativo e leitura de QR Code.

O projeto aplica, na prática, conceitos de desenvolvimento web como organização de componentes, rotas, formulários, middlewares, interceptors, API REST e banco de dados NoSQL na nuvem.

---

## 📑 Sumário

- [Tecnologias](#-tecnologias)
- [Estrutura do projeto](#-estrutura-do-projeto)
- [Rodando no seu computador](#-rodando-no-seu-computador)
- [Banco de dados: MongoDB Atlas](#-banco-de-dados-mongodb-atlas)
- [Como frontend e backend se conectam](#-como-frontend-e-backend-se-conectam)
- [Variáveis de ambiente](#-variáveis-de-ambiente)
- [Publicando na Vercel](#-publicando-na-vercel)
- [Problemas comuns](#-problemas-comuns)
- [Boas práticas de segurança](#-boas-práticas-de-segurança)
- [Scripts úteis](#-scripts-úteis)

---

## 🚀 Tecnologias

### Frontend
- Angular
- TypeScript
- HTML5
- CSS3

### Backend
- NestJS
- TypeScript
- Node.js
- MongoDB (Atlas) com Mongoose

### Ferramentas
- Git
- GitHub
- Visual Studio Code
- Vercel (publicação)

---

## 📂 Estrutura do projeto

```
projeto-eduroom/
├── package.json        Scripts da raiz (npm run dev inicia tudo)
├── DEPLOY-VERCEL.md    Passo a passo de publicação
├── backend/            API NestJS (conecta no MongoDB)
│   ├── .env.example    Modelo das variáveis de ambiente
│   └── src/
└── frontend/           Site Angular
    └── src/
        ├── environments/   Endereço da API (environment.ts)
        └── app/
            ├── pages/        dashboard, login, leitor-qr
            ├── components/   agenda-semanal, minhas-reservas, inicio, sidebar
            └── admin/        painel do administrador
```

---

## 💻 Rodando no seu computador

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão LTS recomendada)
- npm
- Git
- Uma conta gratuita no [MongoDB Atlas](https://www.mongodb.com/atlas) (veja a seção abaixo)

### Passo a passo

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd projeto-eduroom
   ```

2. **Crie o arquivo `backend/.env`** a partir do modelo:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Abra o `backend/.env` e preencha, no mínimo, o `MONGODB_URI` (veja como obtê-lo [aqui](#-banco-de-dados-mongodb-atlas)).

3. **Instale as dependências** (uma única vez):
   ```bash
   npm install            # na raiz
   cd backend && npm install
   cd ../frontend && npm install
   ```

4. **Inicie o projeto** (na raiz):
   ```bash
   npm run dev
   ```
   Isso inicia:
   - Backend em **http://localhost:3001**
   - Frontend em **http://localhost:4200**

---

## 🍃 Banco de dados: MongoDB Atlas

O EduRoom usa o **MongoDB Atlas**, o serviço de MongoDB na nuvem. Isso significa que **não é preciso instalar o MongoDB no computador**: o banco fica hospedado na nuvem e o backend se conecta a ele por uma *connection string*.

### Por que MongoDB?
- É um banco **NoSQL orientado a documentos** (JSON/BSON), que combina naturalmente com TypeScript e Node.js.
- Os dados de salas, reservas e usuários têm formatos flexíveis e evoluem com facilidade, sem migrações complexas.
- O Atlas oferece um plano gratuito (M0), ideal para estudo e protótipos.
- Funciona muito bem com NestJS por meio do Mongoose.

### 1. Criando o cluster no Atlas

1. Acesse [mongodb.com/atlas](https://www.mongodb.com/atlas) e crie uma conta.
2. Crie um **projeto** (ex.: `EduRoom`).
3. Clique em **Build a Database** e escolha o plano **M0 (Free)**.
4. Escolha o provedor e a região (prefira uma região próxima, como São Paulo, se disponível).
5. Dê um nome ao cluster (ex.: `Cluster0`) e finalize a criação.

### 2. Criando o usuário do banco

1. No menu lateral, vá em **Database Access** → **Add New Database User**.
2. Método de autenticação: **Password**.
3. Defina um **nome de usuário** e uma **senha** (guarde-os com segurança).
4. Em permissões, escolha **Read and write to any database** (ou restrinja ao banco do EduRoom).

> ⚠️ Esse usuário é **do banco de dados**, diferente da sua conta de login no site do Atlas.

### 3. Liberando o acesso de rede

1. Vá em **Network Access** → **Add IP Address**.
2. Para desenvolvimento local, clique em **Add Current IP Address**.
3. Para publicar na Vercel, o IP dos servidores muda a cada execução. Por isso é comum liberar **`0.0.0.0/0`** (qualquer IP).

> ⚠️ Liberar `0.0.0.0/0` só é seguro se o usuário do banco tiver **senha forte** e a connection string **nunca** for exposta publicamente.

### 4. Obtendo a connection string

1. No cluster, clique em **Connect** → **Drivers**.
2. Selecione **Node.js** e copie a string, que tem este formato:
   ```
   mongodb+srv://<usuario>:<senha>@cluster0.xxxxx.mongodb.net/eduroom?retryWrites=true&w=majority
   ```
3. Substitua `<usuario>` e `<senha>` pelos dados do passo 2.
4. Note o `/eduroom` antes do `?`: é o **nome do banco** que será usado. Se ele não existir, o MongoDB o cria automaticamente no primeiro registro salvo.

> 🔑 Se a senha tiver caracteres especiais (`@`, `:`, `/`, `#`, `%`...), eles precisam ser codificados em URL. Exemplo: `@` vira `%40`. Ou, mais simples, use uma senha apenas com letras e números.

### 5. Configurando o `.env` do backend

No arquivo `backend/.env`:

```env
# Porta do backend
PORT=3001

# Conexão com o MongoDB Atlas
MONGODB_URI=mongodb+srv://USUARIO:SENHA@cluster0.xxxxx.mongodb.net/eduroom?retryWrites=true&w=majority

# Endereço do frontend permitido pelo CORS
FRONTEND_URL=http://localhost:4200
```

O arquivo `backend/.env.example` deve ser versionado **sem valores reais**, apenas com os nomes das variáveis:

```env
PORT=3001
MONGODB_URI=
FRONTEND_URL=
```

### 6. Como o NestJS se conecta ao MongoDB

A integração é feita com o pacote `@nestjs/mongoose`:

```bash
cd backend
npm install @nestjs/mongoose mongoose @nestjs/config
```

No módulo principal (`app.module.ts`), a conexão lê o `MONGODB_URI` do ambiente:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
    }),
    // demais módulos (salas, reservas, usuários...)
  ],
})
export class AppModule {}
```

### 7. Modelagem dos dados (Schemas)

No MongoDB, cada **collection** é equivalente a uma tabela e cada **documento** a uma linha. No NestJS, cada collection é descrita por um **Schema** do Mongoose.

> 📝 Os exemplos abaixo ilustram a modelagem típica de um sistema de salas. Ajuste os nomes e campos conforme os schemas reais do seu `backend/src`.

#### Collections

| Collection | Descrição |
|------------|-----------|
| `usuarios` | Alunos, professores e administradores que acessam o sistema |
| `salas` | Salas disponíveis para reserva (nome, capacidade, recursos) |
| `reservas` | Reservas feitas por usuários para uma sala em data e horário |

#### Exemplo de schema: Sala

```ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SalaDocument = HydratedDocument<Sala>;

@Schema({ timestamps: true })
export class Sala {
  @Prop({ required: true, unique: true })
  nome: string;

  @Prop({ required: true })
  capacidade: number;

  @Prop({ default: true })
  ativa: boolean;
}

export const SalaSchema = SchemaFactory.createForClass(Sala);
```

#### Exemplo de schema: Reserva

```ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReservaDocument = HydratedDocument<Reserva>;

@Schema({ timestamps: true })
export class Reserva {
  @Prop({ type: Types.ObjectId, ref: 'Sala', required: true })
  sala: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  usuario: Types.ObjectId;

  @Prop({ required: true })
  data: Date;

  @Prop({ required: true })
  horaInicio: string; // ex.: "08:00"

  @Prop({ required: true })
  horaFim: string; // ex.: "09:00"
}

export const ReservaSchema = SchemaFactory.createForClass(Reserva);
```

A opção `timestamps: true` adiciona automaticamente os campos `createdAt` e `updatedAt`.

#### Exemplo de documento salvo no banco

```json
{
  "_id": "6650f1c2a1b2c3d4e5f60789",
  "sala": "6650f0aaa1b2c3d4e5f60111",
  "usuario": "6650f0bba1b2c3d4e5f60222",
  "data": "2026-11-03T00:00:00.000Z",
  "horaInicio": "08:00",
  "horaFim": "09:00",
  "createdAt": "2026-10-29T14:30:00.000Z",
  "updatedAt": "2026-10-29T14:30:00.000Z"
}
```

### 8. Usando os schemas em um módulo

```ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Sala, SalaSchema } from './sala.schema';
import { SalasController } from './salas.controller';
import { SalasService } from './salas.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Sala.name, schema: SalaSchema }])],
  controllers: [SalasController],
  providers: [SalasService],
})
export class SalasModule {}
```

E no service, o model é injetado para consultar e gravar:

```ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sala, SalaDocument } from './sala.schema';

@Injectable()
export class SalasService {
  constructor(@InjectModel(Sala.name) private salaModel: Model<SalaDocument>) {}

  findAll() {
    return this.salaModel.find().exec();
  }

  create(dados: Partial<Sala>) {
    return new this.salaModel(dados).save();
  }
}
```

### 9. Visualizando e editando os dados

- No Atlas, abra **Database** → **Browse Collections** para ver, filtrar, editar e apagar documentos pelo navegador.
- Opcionalmente, use o [MongoDB Compass](https://www.mongodb.com/products/tools/compass) (aplicativo desktop) conectando com a mesma `MONGODB_URI`.

### 10. Fluxo completo dos dados

```
Usuário → Frontend (Angular) → API REST (NestJS) → Mongoose → MongoDB Atlas
                                      ↑
                         MONGODB_URI (variável de ambiente)
```

---

## 🔗 Como frontend e backend se conectam

| De | Para | Como é configurado |
|----|------|--------------------|
| Frontend | Backend | Endereço da API em `frontend/src/environments/environment.ts` (local: `http://localhost:3001`; na Vercel vem da variável `API_URL`) |
| Backend | Frontend | **CORS**: o backend só aceita chamadas do endereço da variável `FRONTEND_URL` (se ela não existir, aceita qualquer site) |
| Backend | Banco | Variável `MONGODB_URI` (MongoDB Atlas) |

---

## 🔐 Variáveis de ambiente

| Variável | Onde | Descrição | Exemplo |
|----------|------|-----------|---------|
| `MONGODB_URI` | Backend | Connection string do MongoDB Atlas | `mongodb+srv://user:senha@cluster0.xxxxx.mongodb.net/eduroom` |
| `FRONTEND_URL` | Backend | Origem permitida pelo CORS | `http://localhost:4200` |
| `PORT` | Backend | Porta da API | `3001` |
| `API_URL` | Frontend (Vercel) | Endereço público do backend | `https://eduroom-api.vercel.app` |

---

## ☁️ Publicando na Vercel

O passo a passo completo está em [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md). Resumo:

1. Publique o **backend** e o **frontend** como dois projetos separados na Vercel.
2. No projeto do **backend**, configure as variáveis `MONGODB_URI` e `FRONTEND_URL` (com o endereço do site publicado).
3. No projeto do **frontend**, configure `API_URL` com o endereço do backend publicado.
4. No MongoDB Atlas, em **Network Access**, libere `0.0.0.0/0` para que a Vercel consiga conectar.
5. Faça o redeploy após alterar qualquer variável de ambiente.

---

## 🛠️ Problemas comuns

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| `MongoServerSelectionError` / timeout | IP não liberado no Atlas | Adicione seu IP (ou `0.0.0.0/0`) em **Network Access** |
| `bad auth: authentication failed` | Usuário ou senha incorretos | Confira o usuário em **Database Access** e redefina a senha se preciso |
| Erro de URI inválida | Caracteres especiais na senha | Codifique a senha em URL (`@` → `%40`) ou use senha só com letras e números |
| `MONGODB_URI` vem `undefined` | `.env` ausente ou fora da pasta `backend/` | Crie `backend/.env` a partir do `.env.example` |
| Erro de CORS no navegador | `FRONTEND_URL` diferente do endereço real do site | Ajuste a variável (sem `/` no final) e reinicie o backend |
| Front não acha a API | `environment.ts` ou `API_URL` incorretos | Confira o endereço da API e se o backend está rodando |
| Deploy na Vercel não conecta ao banco | Variáveis não definidas na Vercel | Defina as variáveis no painel e faça redeploy |

---

## 🛡️ Boas práticas de segurança

- **Nunca** envie o arquivo `.env` ao GitHub. Confirme que ele está no `.gitignore`:
  ```
  .env
  ```
- Versione apenas o `.env.example`, sem valores reais.
- Se a `MONGODB_URI` for exposta por engano, **troque a senha do usuário** no Atlas imediatamente.
- Use senhas fortes e, em produção, defina `FRONTEND_URL` para que o CORS aceite apenas o seu site.
- Dê ao usuário do banco apenas as permissões necessárias.

---

## 📜 Scripts úteis

| Comando | Onde | O que faz |
|---------|------|-----------|
| `npm run dev` | Raiz | Inicia backend e frontend juntos |
| `npm run start:dev` | `backend/` | Inicia só a API em modo desenvolvimento |
| `npm start` | `frontend/` | Inicia só o Angular |
| `npm run build` | `backend/` ou `frontend/` | Gera a versão de produção |

> 📝 Confira os nomes exatos dos scripts nos `package.json` do seu projeto.

---

## 👤 Autores

Desenvolvido por **[Davi Martins, Djulie Fontenele, Adrieli Martins, Alessandra Minucci, Julian Sales e Mayra Rocha]** como projeto de estudo em desenvolvimento web com Angular e NestJS.
