# Publicando o EduRoom na Vercel

O EduRoom são **dois projetos na Vercel**, criados a partir do **mesmo repositório do GitHub**:

| Projeto na Vercel | Pasta (Root Directory) | O que é |
|---|---|---|
| `eduroom-backend` | `backend` | API NestJS |
| `eduroom-frontend` | `frontend` | Site Angular (estático) |

Os dois se conectam por duas variáveis, e é por isso que a **ordem dos passos importa**:

```text
Navegador ──> Frontend (Vercel) ──API_URL──> Backend (Vercel) ──MONGODB_URI──> MongoDB Atlas
                                      Backend só aceita chamadas de ──FRONTEND_URL──> Frontend
```

- `API_URL` (no **frontend**): endereço do backend. É lida no build.
- `FRONTEND_URL` (no **backend**): endereço do site. É usada no CORS.
- `MONGODB_URI` (no **backend**): conexão com o banco.

> Cada projeto precisa do endereço do outro. Por isso: sobe o backend primeiro, depois o frontend, e por último volta ao backend para informar o endereço do frontend.

---

## Passo 0 – Código no GitHub

O repositório já existe. Antes de publicar, envie as últimas alterações:

```bash
git add .
git commit -m "Prepara publicação na Vercel"
git push
```

Confira que o arquivo `backend/.env` **não** aparece no GitHub (ele está no `.gitignore` e nunca deve ser enviado).

## Passo 1 – MongoDB Atlas

1. Em **Database Access**, confirme que existe um usuário com senha. Se a senha tiver caracteres especiais (`@ : / ? #`), eles precisam ser codificados na string de conexão (ex.: `@` vira `%40`).
2. Em **Network Access**, adicione o IP **`0.0.0.0/0`** (permitir de qualquer lugar). A Vercel não usa um IP fixo, então sem isso o backend não consegue conectar.
3. Em **Connect → Drivers**, copie a string de conexão. Use **a mesma do seu `backend/.env`** para enxergar os mesmos dados que você já tem. Ela deve ter o nome do banco depois do `.net/`, assim: `...mongodb.net/eduroom?retryWrites=true&w=majority`. Se não tiver nome de banco, o Mongo usa um banco chamado `test`.

## Passo 2 – Backend

1. Na Vercel: **Add New → Project** e importe o repositório `projeto_room`.
2. Em **Root Directory**, escolha **`backend`**. O framework deve ser detectado como **NestJS**.
3. Em **Environment Variables**, crie:
   - `MONGODB_URI` = a string do Passo 1
4. Clique em **Deploy**.
5. Abra `https://SEU-BACKEND.vercel.app/status`. Se aparecer uma resposta de texto, o backend está no ar e conectado.

> **Use o endereço principal do projeto** (aba *Domains* do projeto), e não o link único de um deploy específico. Com a proteção padrão da Vercel, os links únicos e os de *preview* pedem login da Vercel, mas o domínio principal de produção é público.

Anote o endereço do backend (sem `/` no final).

## Passo 3 – Frontend

1. Na Vercel: **Add New → Project** e importe **o mesmo repositório** de novo.
2. Em **Root Directory**, escolha **`frontend`**. O framework deve ser **Angular**.
3. Em **Environment Variables**, crie:
   - `API_URL` = endereço do backend do Passo 2, por exemplo `https://eduroom-backend.vercel.app` (**https**, sem `/` no final). Marque os ambientes *Production* e *Preview*.
4. Em **Settings → General → Node.js Version**, deixe **24.x** (ou 22.x). O Angular 22 exige Node 22.22.3+ ou 24.15+.
5. Clique em **Deploy**.

O build roda `scripts/set-env.mjs`, que grava o `API_URL` dentro do site. Se você esquecer a variável, o build **falha de propósito** com uma mensagem explicando o que fazer, em vez de publicar um site apontando para `localhost`.

Anote o endereço do frontend (ex.: `https://eduroom-frontend.vercel.app`).

## Passo 4 – Liberar o frontend no backend (CORS)

1. Abra o projeto **backend** na Vercel → **Settings → Environment Variables**.
2. Crie `FRONTEND_URL` = endereço do frontend do Passo 3 (**https**, sem `/` no final). Para mais de um endereço, separe por vírgula.
3. Vá em **Deployments → (os três pontinhos do último deploy) → Redeploy**. Alterar variável de ambiente só vale depois de um novo deploy.

A partir daqui, o backend só aceita chamadas vindas do seu site.

## Passo 5 – Testar tudo

1. Abra o site do frontend e faça login.
2. Crie uma reserva em **Agendamentos** e confira em **Minhas Reservas** (status *Aguardando Aprovação*).
3. Entre como administrador (usuário `ADMIN`, senha `ADMIN`) e aprove ou recuse a reserva.
4. Recarregue a página dentro de `/dashboard` ou `/admin`: não pode dar erro 404.
5. Teste o leitor de QR Code: a câmera funciona porque o site da Vercel usa HTTPS.

---

## Atualizações futuras

Basta fazer `git push`: a Vercel republica sozinha o projeto que mudou. Só mexer em variável de ambiente exige **Redeploy** manual.

## Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Site abre, mas as listas ficam vazias; no Console (F12) aparece `localhost:3001` | `API_URL` não foi aplicada | Defina `API_URL` no projeto do frontend e faça **Redeploy** |
| Console mostra erro de **CORS** | `FRONTEND_URL` diferente do endereço real do site (http em vez de https, `/` no final, domínio errado) ou não houve Redeploy do backend | Corrija e faça Redeploy do backend |
| Backend responde erro 500 ou demora e falha | Atlas bloqueando o IP, `MONGODB_URI` errada ou senha com caractere especial sem codificar | Confira o **Network Access** (`0.0.0.0/0`) e veja **Deployments → Logs** do backend |
| Abrir o backend pede login da Vercel | Você abriu o link único do deploy ou um *preview* | Use o domínio principal do projeto (aba *Domains*) |
| `/dashboard` dá 404 ao recarregar | Root Directory do frontend errado ou `frontend/vercel.json` ausente | Confirme Root Directory = `frontend` |
| Build do frontend falha dizendo que `API_URL` não está definida | Variável não criada | Crie `API_URL` (passo 3) |
| Build do backend falha | Veja o log do deploy | Envie o log para análise |
| Preview deployments (links de branch) não conseguem chamar a API | O CORS só libera o endereço de `FRONTEND_URL` | Teste em produção ou adicione o endereço do preview em `FRONTEND_URL` |

## Rodando no computador (continua igual)

```bash
npm run dev      # na raiz: sobe backend (3001) e frontend (4200)
```

Sem `API_URL` e sem `FRONTEND_URL`, tudo funciona como antes: o frontend fala com `http://localhost:3001` e o backend aceita qualquer origem.

O modo antigo com renderização no servidor (usado no Render) continua disponível com `npm run build:ssr` dentro de `frontend/`, mas **não** é o usado na Vercel.

## Avisos de segurança

- O login de administrador (`ADMIN` / `ADMIN`) é verificado **apenas no navegador**. Para um trabalho de faculdade ou demonstração serve, mas antes de divulgar o site publicamente o ideal é validar no backend (JWT) e trocar essa senha.
- Se a senha do banco já foi compartilhada fora do seu computador (por exemplo, dentro de um arquivo `.zip`), troque a senha do usuário no Atlas e atualize `MONGODB_URI` na Vercel e no seu `backend/.env`.
