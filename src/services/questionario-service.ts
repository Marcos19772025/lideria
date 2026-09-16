import { db } from "../db.js";

export async function listarPerguntasAtivas() {
  const perguntas = await db.pergunta.findMany({
    where: {
      status: "ATIVO",
    },
    orderBy: {
      ordem: "asc",
    },
  });

  return Promise.all(
    perguntas.map(async (pergunta) => {
      const alternativas = await db.alternativa.findMany({
        where: {
          perguntaId: pergunta.id,
        },
        orderBy: {
          ordem: "asc",
        },
      });

      return {
        id: pergunta.id,
        ordem: pergunta.ordem,
        tipo: pergunta.tipo,
        texto: pergunta.texto,
        alternativas: alternativas.map((alternativa) => ({
          codigo: alternativa.codigo,
          texto: alternativa.texto,
          ordem: alternativa.ordem,
        })),
      };
    })
  );
}