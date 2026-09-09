# Mapa Google Sheets -> PostgreSQL

A primeira versao do banco preserva a estrutura funcional do prototipo e adiciona relacionamentos onde eles sao confiaveis.

| Aba atual | Tabela PostgreSQL | Papel |
|---|---|---|
| Configuracoes | configuracoes | Parametros funcionais do sistema |
| Usuarios | usuarios | Credenciais, perfil e status |
| Estagiarios | estagiarios | Dados complementares do estagiario |
| Perguntas | perguntas | Banco de perguntas |
| Alternativas | alternativas | Opcoes vinculadas a cada pergunta |
| Respostas | avaliacoes | Uma avaliacao, com respostas objetivas/discursivas em JSON |
| Resultados_BigFive | resultados_big_five | Resultado 1:1 da avaliacao |
| Resultados_Competencias | resultados_competencias | Competencias 1:1 da avaliacao |
| Treinamentos | treinamentos | Catalogo de atividades |
| Recomendacoes | recomendacoes | Recomendacoes de desenvolvimento |
| Auditoria | auditoria | Eventos de seguranca e operacao |

## Relacionamentos principais

- Usuario 1 -> 0..1 Estagiario
- Estagiario 1 -> 0..N Avaliacoes
- Pergunta 1 -> 0..N Alternativas
- Avaliacao 1 -> 0..1 ResultadoBigFive
- Avaliacao 1 -> 0..1 ResultadoCompetencias
- Avaliacao 1 -> 0..N Recomendacoes
- Treinamento 1 -> 0..N Recomendacoes

## Registros legados orfaos

O prototipo pode conter testes antigos que apontam para usuarios/estagiarios removidos. Para nao perder historico, os campos `*_legado_id` preservam o ID original quando a chave estrangeira nao puder ser criada. O arquivo `migration-report.json` lista esses casos para limpeza posterior.
