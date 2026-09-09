# LiderIA - Migracao do banco

Projeto de transicao do prototipo LiderIA (Google Sheets/Apps Script) para PostgreSQL com Prisma ORM, mantendo o sistema atual funcionando durante a validacao.

## Objetivos

1. Versionar schema, migrations e scripts no GitHub.
2. Permitir que o projeto seja usado em varias maquinas do estagio.
3. Migrar os dados do Google Sheets para PostgreSQL de forma auditavel e repetivel.
4. Nunca versionar dados pessoais, senhas, chaves ou arquivos reais de exportacao.

## Stack desta base

- Node.js 22
- TypeScript
- Prisma ORM 7.10.0
- PostgreSQL
- ExcelJS para ler a exportacao XLSX do Google Sheets
- GitHub Actions para validar schema e TypeScript

A versao 7.10.0 foi fixada propositalmente para evitar que maquinas diferentes instalem majors diferentes durante o estagio. Prisma 8 pode ser avaliado depois como upgrade separado.

## Estrutura

```text
lideria-migracao/
├── .github/workflows/ci.yml
├── data/                     # XLSX real fica aqui, mas e ignorado pelo Git
├── docs/
│   ├── ARQUITETURA.md
│   └── MAPA_PLANILHA_BANCO.md
├── prisma/
│   ├── migrations/
│   │   └── 20260909_init/migration.sql
│   └── schema.prisma
├── scripts/
│   └── import-xlsx.ts
├── src/
│   ├── db.ts
│   └── check-db.ts
├── .env.example
├── .gitignore
├── package.json
├── prisma.config.ts
└── tsconfig.json
```

## 1. Preparar uma maquina nova

Instale Git e Node.js 22. Depois:

```bash
git clone <URL-DO-REPOSITORIO>
cd lideria-migracao
npm install
```

Depois da primeira instalacao, o `package-lock.json` deve ser mantido no GitHub. Nas maquinas seguintes, prefira `npm ci`.

## 2. Configurar o banco

Copie o exemplo:

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

### macOS/Linux

```bash
cp .env.example .env
```

Edite `.env` e coloque a URL real do PostgreSQL:

```text
DATABASE_URL="postgresql://USUARIO:SENHA@HOST:5432/lideria?sslmode=require"
```

**Nunca faça commit do `.env`.**

## 3. Criar a estrutura do banco

```bash
npm run prisma:generate
npm run db:deploy
```

`db:deploy` aplica as migrations ja versionadas. Para uma futura alteracao de schema em ambiente de desenvolvimento, use `npx prisma migrate dev --name nome_da_alteracao` e faça commit da nova pasta de migration.

## 4. Exportar o Google Sheets

No Google Sheets do LiderIA:

Arquivo -> Fazer download -> Microsoft Excel (.xlsx)

Salve localmente como:

```text
data/LiderIA.xlsx
```

A pasta `data` esta protegida pelo `.gitignore`, entao o arquivo com CPF, telefone, endereco e demais dados nao sera enviado ao GitHub.

## 5. Auditar antes de migrar

```bash
npm run migrate:sheets -- --file data/LiderIA.xlsx
```

Esse comando **nao altera o PostgreSQL**. Ele gera `migration-report.json` com:

- quantidade de registros por aba;
- referencias antigas/orfas;
- logins ou CPFs duplicados;
- resultados sem avaliacao correspondente;
- recomendacoes apontando para treinamento/estagiario ausente.

Revise o relatorio antes de aplicar.

## 6. Aplicar a migracao

Somente depois da auditoria:

```bash
npm run migrate:sheets -- --file data/LiderIA.xlsx --apply
```

O importador usa `upsert`, portanto pode ser executado novamente sem simplesmente duplicar os registros principais.

## 7. Conferir o banco

```bash
npm run db:check
```

O comando mostra as contagens principais do PostgreSQL.

Opcionalmente:

```bash
npm run db:studio
```

Abre o Prisma Studio para inspecao visual dos dados.

## Fluxo Git recomendado

Antes de iniciar trabalho em uma maquina:

```bash
git pull
```

Depois das alteracoes:

```bash
git add .
git commit -m "descricao da alteracao"
git push
```

Nunca execute `git add` em um `.env`, XLSX real ou outro arquivo contendo dados pessoais.

## Seguranca e LGPD

O repositorio deve ser privado enquanto contiver a implementacao interna da Neo Estagios. Mesmo em repositorio privado, nao armazene:

- CPF, telefone, endereco, e-mail de usuarios reais;
- arquivos XLSX/CSV exportados do sistema;
- chaves OpenAI;
- `DATABASE_URL` real;
- senhas ou credenciais;
- backups de producao.

O campo `SENHA` existente na planilha e importado para `senha_hash`; a migracao nao deve transformar hashes existentes em senha em texto puro.

## Estrategia de corte

Nao desligue o Google Sheets imediatamente. A sequencia segura e:

1. manter o prototipo atual funcionando;
2. criar PostgreSQL paralelo;
3. rodar auditoria;
4. importar dados;
5. comparar contagens e amostras;
6. adaptar o backend para Prisma;
7. testar com usuarios de teste;
8. somente depois planejar o corte do Sheets como banco principal.
