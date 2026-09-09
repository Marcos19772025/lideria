import { db } from "./db.js";

async function main() {
  const [usuarios, estagiarios, perguntas, avaliacoes, treinamentos, recomendacoes] = await Promise.all([
    db.usuario.count(),
    db.estagiario.count(),
    db.pergunta.count(),
    db.avaliacao.count(),
    db.treinamento.count(),
    db.recomendacao.count(),
  ]);

  console.table({ usuarios, estagiarios, perguntas, avaliacoes, treinamentos, recomendacoes });
}

main()
  .catch((error) => {
    console.error("Falha ao consultar o banco:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
