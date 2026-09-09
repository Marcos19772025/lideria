import ExcelJS from "exceljs";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const fileIndex = args.indexOf("--file");
const filePath = fileIndex >= 0 ? args[fileIndex + 1] : undefined;

if (!filePath) {
  console.error("Uso: npm run migrate:sheets -- --file data/LiderIA.xlsx [--apply]");
  process.exit(1);
}

type RowObject = Record<string, unknown>;
type Issue = { tipo: string; referencia: string; detalhe: string };

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(resolve(filePath));

function rawValue(value: unknown): unknown {
  if (value == null) return null;
  if (value instanceof Date) return value;
  if (typeof value !== "object") return value;

  const object = value as Record<string, unknown>;
  if ("result" in object) return rawValue(object.result);
  if ("text" in object) return object.text;
  if (Array.isArray(object.richText)) {
    return (object.richText as Array<{ text?: string }>).map((item) => item.text ?? "").join("");
  }
  return String(value);
}

function text(value: unknown): string {
  const v = rawValue(value);
  if (v == null) return "";
  if (typeof v === "number") return Number.isInteger(v) ? String(v) : String(v);
  return String(v).trim();
}

function nullableText(value: unknown): string | null {
  const v = text(value);
  return v === "" ? null : v;
}

function integer(value: unknown, fallback = 0): number {
  const v = rawValue(value);
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  const parsed = Number(text(value).replace(",", "."));
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function booleanSim(value: unknown): boolean {
  const v = text(value).toUpperCase();
  return ["SIM", "S", "TRUE", "VERDADEIRO", "1"].includes(v);
}

function dateValue(value: unknown): Date | null {
  const v = rawValue(value);
  if (v == null || v === "") return null;
  if (v instanceof Date) return v;
  if (typeof v === "number" && Number.isFinite(v)) {
    return new Date(Date.UTC(1899, 11, 30) + v * 86_400_000);
  }

  const s = text(v);
  let match = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (match) {
    const [, dd, mm, yyyy, hh = "00", mi = "00", ss = "00"] = match;
    return new Date(`${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}-03:00`);
  }

  match = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (match) {
    const [, yyyy, mm, dd, hh = "00", mi = "00", ss = "00"] = match;
    return new Date(`${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}-03:00`);
  }

  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function jsonValue(value: unknown, fallback: object | unknown[] = {}): any {
  const v = rawValue(value);
  if (v == null || v === "") return fallback;
  if (typeof v === "object") return v;
  try {
    return JSON.parse(String(v));
  } catch {
    return String(v);
  }
}

function sheetRows(sheetName: string): RowObject[] {
  const sheet = workbook.getWorksheet(sheetName);
  if (!sheet) throw new Error(`Aba obrigatoria ausente: ${sheetName}`);

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = text(cell.value).toUpperCase();
  });

  const rows: RowObject[] = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const object: RowObject = {};
    let hasValue = false;
    headers.forEach((header, colNumber) => {
      if (!header) return;
      const value = rawValue(row.getCell(colNumber).value);
      object[header] = value;
      if (value != null && text(value) !== "") hasValue = true;
    });
    if (hasValue) rows.push(object);
  }
  return rows;
}

const data = {
  configuracoes: sheetRows("Configuracoes"),
  usuarios: sheetRows("Usuarios"),
  estagiarios: sheetRows("Estagiarios"),
  perguntas: sheetRows("Perguntas"),
  alternativas: sheetRows("Alternativas"),
  respostas: sheetRows("Respostas"),
  bigFive: sheetRows("Resultados_BigFive"),
  competencias: sheetRows("Resultados_Competencias"),
  treinamentos: sheetRows("Treinamentos"),
  recomendacoes: sheetRows("Recomendacoes"),
  auditoria: sheetRows("Auditoria"),
};

const issues: Issue[] = [];
const usuarioIds = new Set(data.usuarios.map((r) => text(r.ID)).filter(Boolean));
const estagiarioIds = new Set(data.estagiarios.map((r) => text(r.ID_ESTAGIARIO)).filter(Boolean));
const avaliacaoIds = new Set(data.respostas.map((r) => text(r.ID_AVALIACAO)).filter(Boolean));
const treinamentoIds = new Set(data.treinamentos.map((r) => text(r.ID_TREINAMENTO)).filter(Boolean));
const perguntaIds = new Set(data.perguntas.map((r) => text(r.ID_PERGUNTA)).filter(Boolean));

for (const row of data.estagiarios) {
  const id = text(row.ID_ESTAGIARIO);
  const usuarioId = text(row.ID_USUARIO);
  if (usuarioId && !usuarioIds.has(usuarioId)) {
    issues.push({ tipo: "FK_USUARIO", referencia: id, detalhe: `ID_USUARIO ${usuarioId} nao existe em Usuarios` });
  }
}
for (const row of data.alternativas) {
  const id = text(row.ID_ALTERNATIVA);
  const perguntaId = text(row.ID_PERGUNTA);
  if (perguntaId && !perguntaIds.has(perguntaId)) {
    issues.push({ tipo: "FK_PERGUNTA", referencia: id, detalhe: `ID_PERGUNTA ${perguntaId} nao existe em Perguntas` });
  }
}
for (const row of data.respostas) {
  const id = text(row.ID_AVALIACAO);
  const estagiarioId = text(row.ID_ESTAGIARIO);
  if (estagiarioId && !estagiarioIds.has(estagiarioId)) {
    issues.push({ tipo: "FK_ESTAGIARIO", referencia: id, detalhe: `ID_ESTAGIARIO ${estagiarioId} nao existe em Estagiarios` });
  }
}
for (const row of [...data.bigFive, ...data.competencias]) {
  const avaliacaoId = text(row.ID_AVALIACAO);
  if (avaliacaoId && !avaliacaoIds.has(avaliacaoId)) {
    issues.push({ tipo: "FK_AVALIACAO_RESULTADO", referencia: avaliacaoId, detalhe: "Resultado sem avaliacao correspondente" });
  }
}
for (const row of data.recomendacoes) {
  const avaliacaoId = text(row.ID_AVALIACAO);
  const estagiarioId = text(row.ID_ESTAGIARIO);
  const treinamentoId = text(row.ID_TREINAMENTO);
  if (avaliacaoId && !avaliacaoIds.has(avaliacaoId)) {
    issues.push({ tipo: "FK_AVALIACAO_RECOMENDACAO", referencia: avaliacaoId, detalhe: "Recomendacao sem avaliacao correspondente" });
  }
  if (estagiarioId && !estagiarioIds.has(estagiarioId)) {
    issues.push({ tipo: "FK_ESTAGIARIO_RECOMENDACAO", referencia: avaliacaoId, detalhe: `ID_ESTAGIARIO ${estagiarioId} ausente` });
  }
  if (treinamentoId && !treinamentoIds.has(treinamentoId)) {
    issues.push({ tipo: "FK_TREINAMENTO_RECOMENDACAO", referencia: avaliacaoId, detalhe: `ID_TREINAMENTO ${treinamentoId} ausente` });
  }
}

function duplicateValues(rows: RowObject[], field: string): string[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = text(row[field]).toLowerCase();
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].filter(([, count]) => count > 1).map(([value]) => value);
}

const duplicateLogins = duplicateValues(data.usuarios, "LOGIN");
const duplicateCpfs = duplicateValues(data.usuarios.filter((r) => text(r.CPF) !== ""), "CPF");
for (const login of duplicateLogins) issues.push({ tipo: "DUPLICIDADE_LOGIN", referencia: login, detalhe: "LOGIN duplicado" });
for (const cpf of duplicateCpfs) issues.push({ tipo: "DUPLICIDADE_CPF", referencia: cpf, detalhe: "CPF duplicado" });

const report = {
  geradoEm: new Date().toISOString(),
  arquivo: resolve(filePath),
  modo: apply ? "APLICACAO" : "AUDITORIA",
  contagens: Object.fromEntries(Object.entries(data).map(([key, rows]) => [key, rows.length])),
  problemas: issues,
};

await writeFile("migration-report.json", JSON.stringify(report, null, 2), "utf8");
console.table(report.contagens);
console.log(`Auditoria concluida: ${issues.length} problema(s). Relatorio: migration-report.json`);

if (!apply) {
  console.log("Nenhuma alteracao foi feita no banco. Use --apply somente depois de revisar o relatorio.");
  process.exit(0);
}

const blockers = issues.filter((issue) => ["DUPLICIDADE_LOGIN", "DUPLICIDADE_CPF"].includes(issue.tipo));
if (blockers.length > 0) {
  console.error(`Migracao bloqueada por ${blockers.length} duplicidade(s) em campos unicos. Corrija e rode a auditoria novamente.`);
  process.exit(2);
}

const { db } = await import("../src/db.js");

const existingUsuarioIds = new Set(usuarioIds);
const existingEstagiarioIds = new Set(estagiarioIds);
const existingAvaliacaoIds = new Set(avaliacaoIds);
const existingTreinamentoIds = new Set(treinamentoIds);

try {
  for (const row of data.configuracoes) {
    const chave = text(row.CHAVE);
    if (!chave) continue;
    await db.configuracao.upsert({
      where: { chave },
      create: { chave, valor: text(row.VALOR), descricao: nullableText(row.DESCRICAO) },
      update: { valor: text(row.VALOR), descricao: nullableText(row.DESCRICAO) },
    });
  }

  for (const row of data.usuarios) {
    const id = text(row.ID);
    if (!id) continue;
    const payload = {
      criadoEm: dateValue(row["CRIADO EM"]) ?? new Date(),
      nomeCompleto: text(row["NOME COMPLETO"]),
      cpf: nullableText(row.CPF),
      email: text(row.EMAIL),
      login: text(row.LOGIN),
      senhaHash: text(row.SENHA),
      ultimoAcesso: dateValue(row["ULTIMO ACESSO"]),
      status: text(row.STATUS),
      perfil: text(row.PERFIL),
    };
    await db.usuario.upsert({ where: { id }, create: { id, ...payload }, update: payload });
  }

  for (const row of data.estagiarios) {
    const id = text(row.ID_ESTAGIARIO);
    if (!id) continue;
    const legacyUserId = nullableText(row.ID_USUARIO);
    const usuarioId = legacyUserId && existingUsuarioIds.has(legacyUserId) ? legacyUserId : null;
    const payload = {
      usuarioId,
      usuarioLegadoId: usuarioId ? null : legacyUserId,
      dataCadastro: dateValue(row.DATA_CADASTRO) ?? new Date(),
      dataNascimento: dateValue(row.DATA_NASCIMENTO),
      telefone: nullableText(row.TELEFONE),
      consentimento: booleanSim(row.CONSENTIMENTO),
      consentimentoEm: dateValue(row.CONSENTIMENTO_EM),
      statusCadastro: text(row.STATUS_CADASTRO) || "ATIVO",
      endereco: nullableText(row.ENDERECO),
    };
    await db.estagiario.upsert({ where: { id }, create: { id, ...payload }, update: payload });
  }

  for (const row of data.perguntas) {
    const id = text(row.ID_PERGUNTA);
    if (!id) continue;
    const payload = {
      tipo: text(row.TIPO),
      texto: text(row.TEXTO),
      ordem: integer(row.ORDEM),
      status: text(row.STATUS),
      versao: text(row.VERSAO),
    };
    await db.pergunta.upsert({ where: { id }, create: { id, ...payload }, update: payload });
  }

  for (const row of data.alternativas) {
    const id = text(row.ID_ALTERNATIVA);
    const perguntaId = text(row.ID_PERGUNTA);
    if (!id || !perguntaId || !perguntaIds.has(perguntaId)) continue;
    const payload = {
      perguntaId,
      texto: text(row.TEXTO),
      codigo: text(row.CODIGO),
      ordem: integer(row.ORDEM),
      status: text(row.STATUS),
    };
    await db.alternativa.upsert({ where: { id }, create: { id, ...payload }, update: payload });
  }

  for (const row of data.treinamentos) {
    const id = text(row.ID_TREINAMENTO);
    if (!id) continue;
    const payload = {
      competencia: text(row.COMPETENCIA),
      variante: text(row.VARIANTE),
      nomeAtividade: text(row.NOME_ATIVIDADE),
      objetivo: text(row.OBJETIVO),
      faixaPontuacao: text(row.FAIXA_PONTUACAO),
      instrucoes: text(row.INSTRUCOES),
      duracao: text(row.DURACAO),
      criteriosAvaliacao: text(row.CRITERIOS_AVALIACAO),
      status: text(row.STATUS),
      versao: text(row.VERSAO),
    };
    await db.treinamento.upsert({ where: { id }, create: { id, ...payload }, update: payload });
  }

  for (const row of data.respostas) {
    const id = text(row.ID_AVALIACAO);
    if (!id) continue;
    const legacyEstagiarioId = nullableText(row.ID_ESTAGIARIO);
    const estagiarioId = legacyEstagiarioId && existingEstagiarioIds.has(legacyEstagiarioId) ? legacyEstagiarioId : null;
    const payload = {
      dataHora: dateValue(row.DATA_HORA) ?? new Date(),
      estagiarioId,
      estagiarioLegadoId: estagiarioId ? null : legacyEstagiarioId,
      objetivas: jsonValue(row.OBJETIVAS_JSON, {}),
      discursivas: jsonValue(row.DISCURSIVAS_JSON, {}),
      versaoQuestionario: text(row.VERSAO_QUESTIONARIO),
      statusAnalise: text(row.STATUS_ANALISE),
      dataAnalise: dateValue(row.DATA_ANALISE),
      versaoPrompt: text(row.VERSAO_PROMPT),
      erro: nullableText(row.ERRO),
    };
    await db.avaliacao.upsert({ where: { id }, create: { id, ...payload }, update: payload });
  }

  for (const row of data.bigFive) {
    const avaliacaoId = text(row.ID_AVALIACAO);
    if (!avaliacaoId || !existingAvaliacaoIds.has(avaliacaoId)) continue;
    const payload = {
      abertura: integer(row.ABERTURA),
      conscienciosidade: integer(row.CONSCIENCIOSIDADE),
      extroversao: integer(row.EXTROVERSAO),
      amabilidade: integer(row.AMABILIDADE),
      estabilidadeEmocional: integer(row.ESTABILIDADE_EMOCIONAL),
      confianca: integer(row.CONFIANCA),
      evidencias: jsonValue(row.EVIDENCIAS_JSON, []),
      forcas: jsonValue(row.FORCAS_JSON, []),
      pontosAtencao: jsonValue(row.PONTOS_ATENCAO_JSON, []),
      recomendacoes: jsonValue(row.RECOMENDACOES_JSON, []),
      ressalvas: jsonValue(row.RESSALVAS_JSON, []),
      aprovadoRh: booleanSim(row.APROVADO_RH),
    };
    await db.resultadoBigFive.upsert({
      where: { avaliacaoId },
      create: { avaliacaoId, ...payload },
      update: payload,
    });
  }

  for (const row of data.competencias) {
    const avaliacaoId = text(row.ID_AVALIACAO);
    if (!avaliacaoId || !existingAvaliacaoIds.has(avaliacaoId)) continue;
    const payload = {
      comunicacao: integer(row.COMUNICACAO),
      inteligenciaEmocional: integer(row.INTELIGENCIA_EMOCIONAL),
      tomadaDecisao: integer(row.TOMADA_DECISAO),
      resolucaoProblemas: integer(row.RESOLUCAO_PROBLEMAS),
      trabalhoEquipe: integer(row.TRABALHO_EQUIPE),
      adaptabilidade: integer(row.ADAPTABILIDADE),
      planejamentoOrganizacao: integer(row.PLANEJAMENTO_ORGANIZACAO),
      eticaResponsabilidade: integer(row.ETICA_RESPONSABILIDADE),
      evidencias: jsonValue(row.EVIDENCIAS_JSON, []),
      forcas: jsonValue(row.FORCAS_JSON, []),
      prioridades: jsonValue(row.PRIORIDADES_JSON, []),
      resumoRh: text(row.RESUMO_RH),
      confianca: integer(row.CONFIANCA),
      aprovadoRh: booleanSim(row.APROVADO_RH),
    };
    await db.resultadoCompetencias.upsert({
      where: { avaliacaoId },
      create: { avaliacaoId, ...payload },
      update: payload,
    });
  }

  for (const row of data.recomendacoes) {
    const avaliacaoId = text(row.ID_AVALIACAO);
    if (!avaliacaoId || !existingAvaliacaoIds.has(avaliacaoId)) continue;
    const legacyEstagiarioId = nullableText(row.ID_ESTAGIARIO);
    const estagiarioId = legacyEstagiarioId && existingEstagiarioIds.has(legacyEstagiarioId) ? legacyEstagiarioId : null;
    const legacyTreinamentoId = nullableText(row.ID_TREINAMENTO);
    const treinamentoId = legacyTreinamentoId && existingTreinamentoIds.has(legacyTreinamentoId) ? legacyTreinamentoId : null;
    const idSeed = [avaliacaoId, text(row.COMPETENCIA), legacyTreinamentoId ?? "", text(row.PRIORIDADE)].join("|");
    const id = `REC_${createHash("sha256").update(idSeed).digest("hex").slice(0, 24).toUpperCase()}`;
    const payload = {
      avaliacaoId,
      estagiarioId,
      estagiarioLegadoId: estagiarioId ? null : legacyEstagiarioId,
      competencia: text(row.COMPETENCIA),
      treinamentoId,
      treinamentoLegadoId: treinamentoId ? null : legacyTreinamentoId,
      justificativa: text(row.JUSTIFICATIVA),
      prioridade: text(row.PRIORIDADE),
      prazoSugerido: text(row.PRAZO_SUGERIDO),
      resultadoEsperado: text(row.RESULTADO_ESPERADO),
      status: text(row.STATUS),
      dataRecomendacao: dateValue(row.DATA_RECOMENDACAO) ?? new Date(),
    };
    await db.recomendacao.upsert({ where: { id }, create: { id, ...payload }, update: payload });
  }

  for (const row of data.auditoria) {
    const id = text(row.ID_EVENTO);
    if (!id) continue;
    const payload = {
      dataHora: dateValue(row.DATA_HORA) ?? new Date(),
      atorId: text(row.ID_USUARIO) || "SISTEMA",
      perfil: text(row.PERFIL),
      acao: text(row.ACAO),
      registroAfetado: nullableText(row.REGISTRO_AFETADO),
      resultado: text(row.RESULTADO),
      detalhes: nullableText(row.DETALHES),
    };
    await db.auditoria.upsert({ where: { id }, create: { id, ...payload }, update: payload });
  }

  console.log("Migracao aplicada. Execute: npm run db:check");
} finally {
  await db.$disconnect();
}
