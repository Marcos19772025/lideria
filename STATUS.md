# Status da migracao LiderIA

## Pronto

- Estrutura Node.js + TypeScript
- Prisma ORM 7.10.0 fixado
- Schema relacional baseado nas 11 abas atuais do LiderIA
- Migration SQL inicial para PostgreSQL
- Importador XLSX com modo auditoria e modo aplicacao
- Tratamento de referencias legadas/orfas
- Verificacao de duplicidade de LOGIN/CPF antes da aplicacao
- Consulta de conferencia de contagens
- `.gitignore` para dados e segredos
- `.env.example`
- GitHub Actions para validar schema, gerar client e checar TypeScript
- Documentacao de arquitetura e mapa planilha -> banco

## Falta executar no ambiente definitivo

- Criar/selecionar o PostgreSQL da Neo Estagios ou provedor aprovado
- Inserir a `DATABASE_URL` somente no ambiente seguro
- Aplicar a migration no PostgreSQL
- Exportar uma copia XLSX do LiderIA para a maquina de migracao
- Rodar a auditoria e revisar `migration-report.json`
- Aplicar a importacao
- Comparar contagens e amostras com o Google Sheets
- Adaptar gradualmente o backend atual para consultar o novo banco

O Google Sheets/Apps Script aprovado permanece inalterado ate a validacao completa.
