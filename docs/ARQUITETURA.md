# Arquitetura de migracao do LiderIA

## Estado atual

Navegador -> Google Apps Script -> Google Sheets -> OpenAI API

## Etapa de transicao

Google Sheets continua sendo a fonte do prototipo aprovado enquanto um PostgreSQL paralelo e criado e validado.

Google Sheets -> exportacao XLSX -> auditoria -> Prisma -> PostgreSQL

O codigo, o schema Prisma e as migrations ficam no GitHub. Dados reais, arquivos XLSX, `.env`, chaves e senhas nunca devem ser versionados.

## Depois da validacao

O backend do LiderIA podera passar a ler/escrever no PostgreSQL. A troca deve ser feita por etapas, com comparacao de contagens e resultados antes do corte definitivo.

## Uso entre varias maquinas

Cada maquina clona o mesmo repositorio. O banco permanece centralizado. Assim, codigo e migrations viajam pelo GitHub; os dados nao.
