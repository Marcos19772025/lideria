-- Migracao inicial do LiderIA.
-- Criada a partir da estrutura atual do Google Sheets.

CREATE TABLE "configuracoes" (
  "chave" VARCHAR(100) NOT NULL,
  "valor" TEXT NOT NULL,
  "descricao" TEXT,
  CONSTRAINT "configuracoes_pkey" PRIMARY KEY ("chave")
);

CREATE TABLE "usuarios" (
  "id" VARCHAR(40) NOT NULL,
  "criado_em" TIMESTAMP(3) NOT NULL,
  "nome_completo" VARCHAR(200) NOT NULL,
  "cpf" VARCHAR(14),
  "email" VARCHAR(254) NOT NULL,
  "login" VARCHAR(100) NOT NULL,
  "senha_hash" TEXT NOT NULL,
  "ultimo_acesso" TIMESTAMP(3),
  "status" VARCHAR(30) NOT NULL,
  "perfil" VARCHAR(30) NOT NULL,
  CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "estagiarios" (
  "id" VARCHAR(40) NOT NULL,
  "usuario_id" VARCHAR(40),
  "usuario_legado_id" VARCHAR(40),
  "data_cadastro" TIMESTAMP(3) NOT NULL,
  "data_nascimento" DATE,
  "telefone" VARCHAR(30),
  "consentimento" BOOLEAN NOT NULL DEFAULT false,
  "consentimento_em" TIMESTAMP(3),
  "status_cadastro" VARCHAR(30) NOT NULL,
  "endereco" TEXT,
  CONSTRAINT "estagiarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "perguntas" (
  "id" VARCHAR(30) NOT NULL,
  "tipo" VARCHAR(30) NOT NULL,
  "texto" TEXT NOT NULL,
  "ordem" INTEGER NOT NULL,
  "status" VARCHAR(30) NOT NULL,
  "versao" VARCHAR(30) NOT NULL,
  CONSTRAINT "perguntas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "alternativas" (
  "id" VARCHAR(50) NOT NULL,
  "pergunta_id" VARCHAR(30) NOT NULL,
  "texto" TEXT NOT NULL,
  "codigo" VARCHAR(30) NOT NULL,
  "ordem" INTEGER NOT NULL,
  "status" VARCHAR(30) NOT NULL,
  CONSTRAINT "alternativas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "avaliacoes" (
  "id" VARCHAR(40) NOT NULL,
  "data_hora" TIMESTAMP(3) NOT NULL,
  "estagiario_id" VARCHAR(40),
  "estagiario_legado_id" VARCHAR(40),
  "objetivas_json" JSONB NOT NULL,
  "discursivas_json" JSONB NOT NULL,
  "versao_questionario" VARCHAR(30) NOT NULL,
  "status_analise" VARCHAR(30) NOT NULL,
  "data_analise" TIMESTAMP(3),
  "versao_prompt" VARCHAR(30) NOT NULL,
  "erro" TEXT,
  CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "resultados_big_five" (
  "avaliacao_id" VARCHAR(40) NOT NULL,
  "abertura" INTEGER NOT NULL,
  "conscienciosidade" INTEGER NOT NULL,
  "extroversao" INTEGER NOT NULL,
  "amabilidade" INTEGER NOT NULL,
  "estabilidade_emocional" INTEGER NOT NULL,
  "confianca" INTEGER NOT NULL,
  "evidencias_json" JSONB NOT NULL,
  "forcas_json" JSONB NOT NULL,
  "pontos_atencao_json" JSONB NOT NULL,
  "recomendacoes_json" JSONB NOT NULL,
  "ressalvas_json" JSONB NOT NULL,
  "aprovado_rh" BOOLEAN NOT NULL,
  CONSTRAINT "resultados_big_five_pkey" PRIMARY KEY ("avaliacao_id")
);

CREATE TABLE "resultados_competencias" (
  "avaliacao_id" VARCHAR(40) NOT NULL,
  "comunicacao" INTEGER NOT NULL,
  "inteligencia_emocional" INTEGER NOT NULL,
  "tomada_decisao" INTEGER NOT NULL,
  "resolucao_problemas" INTEGER NOT NULL,
  "trabalho_equipe" INTEGER NOT NULL,
  "adaptabilidade" INTEGER NOT NULL,
  "planejamento_organizacao" INTEGER NOT NULL,
  "etica_responsabilidade" INTEGER NOT NULL,
  "evidencias_json" JSONB NOT NULL,
  "forcas_json" JSONB NOT NULL,
  "prioridades_json" JSONB NOT NULL,
  "resumo_rh" TEXT NOT NULL,
  "confianca" INTEGER NOT NULL,
  "aprovado_rh" BOOLEAN NOT NULL,
  CONSTRAINT "resultados_competencias_pkey" PRIMARY KEY ("avaliacao_id")
);

CREATE TABLE "treinamentos" (
  "id" VARCHAR(80) NOT NULL,
  "competencia" VARCHAR(120) NOT NULL,
  "variante" VARCHAR(10) NOT NULL,
  "nome_atividade" VARCHAR(250) NOT NULL,
  "objetivo" TEXT NOT NULL,
  "faixa_pontuacao" VARCHAR(30) NOT NULL,
  "instrucoes" TEXT NOT NULL,
  "duracao" VARCHAR(40) NOT NULL,
  "criterios_avaliacao" TEXT NOT NULL,
  "status" VARCHAR(30) NOT NULL,
  "versao" VARCHAR(30) NOT NULL,
  CONSTRAINT "treinamentos_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "recomendacoes" (
  "id" VARCHAR(50) NOT NULL,
  "avaliacao_id" VARCHAR(40) NOT NULL,
  "estagiario_id" VARCHAR(40),
  "estagiario_legado_id" VARCHAR(40),
  "competencia" VARCHAR(120) NOT NULL,
  "treinamento_id" VARCHAR(80),
  "treinamento_legado_id" VARCHAR(80),
  "justificativa" TEXT NOT NULL,
  "prioridade" VARCHAR(40) NOT NULL,
  "prazo_sugerido" VARCHAR(60) NOT NULL,
  "resultado_esperado" TEXT NOT NULL,
  "status" VARCHAR(30) NOT NULL,
  "data_recomendacao" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "recomendacoes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auditoria" (
  "id" VARCHAR(50) NOT NULL,
  "data_hora" TIMESTAMP(3) NOT NULL,
  "ator_id" VARCHAR(80) NOT NULL,
  "perfil" VARCHAR(30) NOT NULL,
  "acao" VARCHAR(100) NOT NULL,
  "registro_afetado" TEXT,
  "resultado" VARCHAR(30) NOT NULL,
  "detalhes" TEXT,
  CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "usuarios_cpf_key" ON "usuarios"("cpf");
CREATE UNIQUE INDEX "usuarios_login_key" ON "usuarios"("login");
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");
CREATE UNIQUE INDEX "estagiarios_usuario_id_key" ON "estagiarios"("usuario_id");
CREATE INDEX "estagiarios_usuario_legado_id_idx" ON "estagiarios"("usuario_legado_id");
CREATE INDEX "perguntas_ordem_idx" ON "perguntas"("ordem");
CREATE UNIQUE INDEX "alternativas_pergunta_id_codigo_key" ON "alternativas"("pergunta_id", "codigo");
CREATE INDEX "alternativas_pergunta_id_ordem_idx" ON "alternativas"("pergunta_id", "ordem");
CREATE INDEX "avaliacoes_estagiario_id_idx" ON "avaliacoes"("estagiario_id");
CREATE INDEX "avaliacoes_estagiario_legado_id_idx" ON "avaliacoes"("estagiario_legado_id");
CREATE INDEX "avaliacoes_status_analise_idx" ON "avaliacoes"("status_analise");
CREATE INDEX "treinamentos_competencia_idx" ON "treinamentos"("competencia");
CREATE INDEX "recomendacoes_avaliacao_id_idx" ON "recomendacoes"("avaliacao_id");
CREATE INDEX "recomendacoes_estagiario_id_idx" ON "recomendacoes"("estagiario_id");
CREATE INDEX "recomendacoes_treinamento_id_idx" ON "recomendacoes"("treinamento_id");
CREATE INDEX "auditoria_data_hora_idx" ON "auditoria"("data_hora");
CREATE INDEX "auditoria_ator_id_idx" ON "auditoria"("ator_id");

ALTER TABLE "estagiarios"
  ADD CONSTRAINT "estagiarios_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "alternativas"
  ADD CONSTRAINT "alternativas_pergunta_id_fkey"
  FOREIGN KEY ("pergunta_id") REFERENCES "perguntas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "avaliacoes"
  ADD CONSTRAINT "avaliacoes_estagiario_id_fkey"
  FOREIGN KEY ("estagiario_id") REFERENCES "estagiarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "resultados_big_five"
  ADD CONSTRAINT "resultados_big_five_avaliacao_id_fkey"
  FOREIGN KEY ("avaliacao_id") REFERENCES "avaliacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "resultados_competencias"
  ADD CONSTRAINT "resultados_competencias_avaliacao_id_fkey"
  FOREIGN KEY ("avaliacao_id") REFERENCES "avaliacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recomendacoes"
  ADD CONSTRAINT "recomendacoes_avaliacao_id_fkey"
  FOREIGN KEY ("avaliacao_id") REFERENCES "avaliacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recomendacoes"
  ADD CONSTRAINT "recomendacoes_estagiario_id_fkey"
  FOREIGN KEY ("estagiario_id") REFERENCES "estagiarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "recomendacoes"
  ADD CONSTRAINT "recomendacoes_treinamento_id_fkey"
  FOREIGN KEY ("treinamento_id") REFERENCES "treinamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
