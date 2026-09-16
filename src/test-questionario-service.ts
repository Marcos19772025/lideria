import { db } from "./db.js";
import { listarPerguntasAtivas } from "./services/questionario-service.js";

async function main() {
  const perguntas = await listarPerguntasAtivas();

  console.log(`Perguntas ativas encontradas: ${perguntas.length}`);

  console.log(perguntas.slice(0, 3));
}

main()
  .catch((error) => {
    console.error("Erro ao testar questionario-service:", error);
  })
  .finally(async () => {
    await db.$disconnect();
  });