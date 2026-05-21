# 🏛️ SF-DGCI — Sistema de Gestão Sindical

**Sindicato dos Funcionários da Direcção-Geral das Contribuições e Impostos — Guiné-Bissau**

Aplicação web completa para gestão interna do sindicato: membros, quotas, finanças, documentos, comunicados e departamentos, com interface moderna e responsiva.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Módulos](#módulos)
- [Arquitectura e Tecnologias](#arquitectura-e-tecnologias)
- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Como Lançar](#como-lançar)
- [Credenciais de Acesso](#credenciais-de-acesso)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Estrutura do Projecto](#estrutura-do-projecto)
- [Scripts Disponíveis](#scripts-disponíveis)
- [API — Endpoints Principais](#api--endpoints-principais)
- [Segurança](#segurança)
- [Notas de Desenvolvimento](#notas-de-desenvolvimento)

---

## Visão Geral

O **SF-DGCI** é um sistema de gestão desenvolvido especificamente para o Sindicato dos Funcionários da DGCI da Guiné-Bissau. Permite:

- Registar e gerir todos os membros do sindicato (dados pessoais, profissionais, foto)
- Controlar pagamentos de quotas mensais com mapa visual por membro e por mês
- Gerir receitas e despesas com controlo financeiro por mês e por ano
- Carregar e organizar documentos internos
- Publicar comunicados para os membros
- Gerar relatórios em PDF e Excel
- Gerir departamentos e direcções da DGCI
- Administrar utilizadores e perfis de acesso

---

## Módulos

| Módulo | Descrição |
|--------|-----------|
| 🏠 **Dashboard** | Painel principal com estatísticas em tempo real: total de membros, quotas pagas/em dívida, receitas, saldo e gráficos mensais |
| 👥 **Membros** | Cadastro completo com foto, dados pessoais, profissionais e documentos de identificação. CRUD completo com pesquisa e filtros |
| 💳 **Quotas** | Mapa anual de pagamentos por membro. Visualização mês a mês do estado: pago, em dívida ou não lançado. Registo de pagamentos com método e referência |
| 💰 **Controlo Financeiro** | Gestão de receitas e despesas. Navegador de mês/ano com resumo mensal e anual. Registo de movimentos com categorias |
| 📄 **Documentos** | Upload de ficheiros (PDF, Word, imagens). Organização por categoria, download e eliminação |
| 📢 **Comunicados** | Criação e publicação de comunicados internos com estado rascunho/publicado e gestão de destinatários |
| 📊 **Relatórios** | Exportação de listagens de membros e mapas de quotas em formato PDF e Excel |
| 🏢 **Departamentos** | Gestão de serviços e direcções da DGCI com associação a membros |
| ⚙️ **Configurações** | Gestão de utilizadores do sistema, perfis de acesso (administrador / operador / consulta) e configurações gerais |

---

## Arquitectura e Tecnologias

```
sindicato/
├── backend/     → API REST
└── frontend/    → Interface Web
```

### Backend
- **Runtime:** Node.js v22+
- **Framework:** Express.js 4
- **Base de Dados:** PostgreSQL (porta 5433)
- **Autenticação:** JWT (JSON Web Tokens) + bcrypt
- **Upload de Ficheiros:** Multer + Sharp (redimensionamento de imagens)
- **Geração de PDF:** PDFKit + pdfkit-table
- **Exportação Excel:** XLSX
- **QR Code:** qrcode
- **Validação:** Joi + express-validator
- **Segurança:** Helmet, CORS, express-rate-limit
- **Logs:** Morgan

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite 5
- **Estilo:** TailwindCSS 3 + CSS personalizado
- **Routing:** React Router DOM 6
- **HTTP Client:** Axios
- **Gráficos:** Recharts
- **Ícones:** Lucide React
- **Notificações:** React Hot Toast
- **Formulários:** React Hook Form
- **Fontes:** Inter + Outfit (Google Fonts)

### Base de Dados
- **Sistema:** PostgreSQL
- **Porta:** 5433
- **Nome:** `sistema_gestao`

---

## Requisitos

Antes de instalar, certifique-se de ter:

- **Node.js** v18 ou superior ([nodejs.org](https://nodejs.org))
- **npm** v9 ou superior (incluído com Node.js)
- **PostgreSQL** v14 ou superior, configurado na porta **5433**
- Base de dados `sistema_gestao` criada e acessível

---

## Instalação

### 1. Clonar / Aceder ao projecto

```bash
cd /home/badjalo/Documentos/PROJETOS/sindicato
```

### 2. Instalar dependências do Backend

```bash
cd backend
npm install
```

### 3. Instalar dependências do Frontend

```bash
cd ../frontend
npm install
```

### 4. Configurar variáveis de ambiente

O ficheiro `backend/.env` já está configurado. Verifique se os dados da base de dados estão correctos (ver secção [Variáveis de Ambiente](#variáveis-de-ambiente)).

### 5. Criar as tabelas na base de dados

```bash
cd backend
npm run migrate
```

### 6. Criar o utilizador administrador

```bash
npm run seed
```

---

## Como Lançar

> **Importante:** O PostgreSQL deve estar em execução **antes** de iniciar o backend.

### Terminal 1 — Backend (API)

```bash
cd /home/badjalo/Documentos/PROJETOS/sindicato/backend
npm run dev
```

✅ A API estará disponível em: **http://localhost:5000**

---

### Terminal 2 — Frontend

```bash
cd /home/badjalo/Documentos/PROJETOS/sindicato/frontend
npm run dev
```

✅ A aplicação estará disponível em: **http://localhost:5173**

---

Abra o browser e aceda a: **http://localhost:5173**

---

## Credenciais de Acesso

| Campo | Valor |
|-------|-------|
| **URL** | http://localhost:5173 |
| **Email** | `admin@sf-dgci.gw` |
| **Password** | `Admin@2026!` |
| **Perfil** | Administrador |

> **Nota:** Para criar mais utilizadores, aceda a **Configurações → Utilizadores** após fazer login como administrador.

---

## Variáveis de Ambiente

Ficheiro: `backend/.env`

```env
# Ambiente
NODE_ENV=development
PORT=5000

# Base de Dados PostgreSQL
DB_HOST=localhost
DB_PORT=5433
DB_NAME=sistema_gestao
DB_USER=Badjalo
DB_PASSWORD=Badjalo25

# Autenticação JWT
JWT_SECRET=sf-dgci-super-secret-jwt-key-2026-guinee-bissau
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Upload de Ficheiros
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760   # 10 MB

# Email (SMTP — configurar com dados reais para envio)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=sindicatodgci@gmail.com
SMTP_PASS=your_app_password

# CORS — URL do Frontend
FRONTEND_URL=http://localhost:5173

# Credenciais do Admin padrão (usado pelo seed)
ADMIN_EMAIL=admin@sf-dgci.gw
ADMIN_PASSWORD=Admin@2026!
```

> **Atenção:** Em produção, altere `JWT_SECRET` e `ADMIN_PASSWORD` para valores seguros e nunca os exponha publicamente.

---

## Estrutura do Projecto

```
sindicato/
├── README.md
├── backend/
│   ├── .env                        ← Variáveis de ambiente
│   ├── server.js                   ← Entrada principal da API
│   ├── package.json
│   ├── uploads/                    ← Ficheiros carregados pelos utilizadores
│   └── src/
│       ├── config/
│       │   └── database.js         ← Pool de ligação ao PostgreSQL
│       ├── controllers/            ← Lógica de negócio
│       │   ├── auth.controller.js
│       │   ├── membros.controller.js
│       │   ├── quotas.controller.js
│       │   ├── financeiro.controller.js
│       │   ├── documentos.controller.js
│       │   ├── comunicados.controller.js
│       │   ├── relatorios.controller.js
│       │   ├── departamentos.controller.js
│       │   └── configuracoes.controller.js
│       ├── middleware/
│       │   ├── auth.middleware.js  ← Verificação JWT
│       │   ├── upload.middleware.js← Multer
│       │   └── validate.middleware.js
│       └── routes/                 ← Endpoints da API
│           ├── auth.routes.js
│           ├── membros.routes.js
│           ├── quotas.routes.js
│           ├── financeiro.routes.js
│           ├── documentos.routes.js
│           ├── comunicados.routes.js
│           ├── relatorios.routes.js
│           ├── departamentos.routes.js
│           ├── dashboard.routes.js
│           └── configuracoes.routes.js
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── package.json
    └── src/
        ├── main.jsx                ← Entrada React
        ├── App.jsx                 ← Rotas principais
        ├── index.css               ← Design system global
        ├── assets/
        │   └── logo.jpeg
        ├── components/
        │   ├── Header.jsx          ← Barra superior
        │   └── Sidebar.jsx         ← Menu lateral
        ├── context/
        │   └── AuthContext.jsx     ← Estado de autenticação global
        ├── services/
        │   └── api.js              ← Cliente Axios (base URL, interceptors)
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── Quotas.jsx
            ├── Financeiro.jsx
            ├── Documentos.jsx
            ├── Comunicados.jsx
            ├── Relatorios.jsx
            ├── Departamentos.jsx
            ├── Configuracoes.jsx
            └── Membros/
                ├── MembrosList.jsx
                ├── MembroForm.jsx      ← Novo membro
                ├── MembroEditar.jsx    ← Editar membro
                └── MembroPerfil.jsx    ← Ver perfil
```

---

## Scripts Disponíveis

### Backend (`/backend`)

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia com auto-reload (nodemon) — **usar em desenvolvimento** |
| `npm start` | Inicia sem auto-reload — para produção |
| `npm run migrate` | Cria/actualiza as tabelas na base de dados |
| `npm run seed` | Cria o utilizador administrador padrão |

### Frontend (`/frontend`)

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento Vite (hot-reload) |
| `npm run build` | Compila a versão de produção em `/dist` |
| `npm run preview` | Pré-visualiza localmente a build de produção |

---

## API — Endpoints Principais

Todos os endpoints (excepto `/auth/login`) requerem o header:

```
Authorization: Bearer <token>
```

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/auth/login` | Autenticação e obtenção do token |
| `GET` | `/api/dashboard` | Estatísticas do dashboard |
| `GET` | `/api/membros` | Lista de membros (com paginação e filtros) |
| `POST` | `/api/membros` | Criar novo membro |
| `GET` | `/api/membros/:id` | Detalhes de um membro |
| `PUT` | `/api/membros/:id` | Actualizar membro |
| `DELETE` | `/api/membros/:id` | Eliminar membro |
| `GET` | `/api/quotas/situacao` | Mapa anual de quotas |
| `POST` | `/api/quotas/pagamentos` | Registar pagamento de quota |
| `GET` | `/api/financeiro/resumo` | Resumo financeiro (mensal/anual) |
| `GET` | `/api/financeiro/transacoes` | Lista de movimentos financeiros |
| `POST` | `/api/financeiro/transacoes` | Registar novo movimento |
| `GET` | `/api/documentos` | Lista de documentos |
| `POST` | `/api/documentos` | Carregar novo documento |
| `GET` | `/api/comunicados` | Lista de comunicados |
| `POST` | `/api/comunicados` | Criar comunicado |
| `GET` | `/api/departamentos` | Lista de departamentos |
| `GET` | `/api/relatorios/membros/pdf` | Exportar membros em PDF |
| `GET` | `/api/relatorios/quotas/excel` | Exportar quotas em Excel |

---

## Segurança

- **Autenticação:** JSON Web Tokens (JWT) com expiração de 24 horas
- **Passwords:** Hash com bcrypt (salt rounds 10)
- **Rate Limiting:** Máximo de 100 pedidos por 15 minutos por IP
- **Headers:** Helmet.js configura headers de segurança HTTP
- **CORS:** Apenas permite pedidos do frontend configurado
- **Upload:** Limitado a 10 MB por ficheiro; tipos validados no servidor
- **Validação:** Todos os inputs validados com Joi e express-validator

---

## Notas de Desenvolvimento

### Perfis de Utilizador

| Perfil | Permissões |
|--------|-----------|
| `administrador` | Acesso total a todos os módulos |
| `operador` | Leitura e escrita, sem configurações |
| `consulta` | Apenas leitura |

### PostgreSQL na porta 5433

O projecto usa a porta `5433` (não a padrão `5432`). Se o seu PostgreSQL estiver na porta padrão, actualize `DB_PORT=5432` no ficheiro `.env`.

### Reiniciar a password do Admin

Se perder acesso ao administrador, execute:

```bash
cd backend
node reset-admin.js
```

### Email SMTP

Para envio real de emails (notificações, comunicados), configure no `.env`:
```env
SMTP_PASS=<App Password do Gmail>
```
Gere uma App Password em: Google Account → Segurança → Verificação em dois passos → App Passwords.

---

## Licença

Projecto desenvolvido para uso interno do **Sindicato dos Funcionários da DGCI — Guiné-Bissau**.

© 2026 SF-DGCI. Todos os direitos reservados.
