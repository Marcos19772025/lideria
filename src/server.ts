import express from "express";
import { listarPerguntasAtivas } from "./services/questionario-service.js";

const app = express();
const porta = 3000;

app.use(express.json());

app.get("/saude", (_req, res) => {
  res.json({
    ok: true,
    sistema: "LiderIA",
  });
});

app.get("/perguntas", async (_req, res) => {
  try {
    const perguntas = await listarPerguntasAtivas();

    res.json({
      total: perguntas.length,
      perguntas,
    });
  } catch (error) {
    console.error("Erro ao consultar perguntas:", error);

    res.status(500).json({
      erro: "Nao foi possivel consultar as perguntas.",
    });
  }
});

app.listen(porta, () => {
  console.log(`LiderIA API funcionando em http://localhost:${porta}`);
});