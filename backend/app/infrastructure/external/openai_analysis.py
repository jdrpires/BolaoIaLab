import json
import re

from openai import AsyncOpenAI

from app.core import get_settings
from app.domain.entities import Match


class OpenAIGameAnalysisClient:
    async def analyze(self, match: Match, sports_payload: dict | None = None) -> dict:
        settings = get_settings()
        if not settings.openai_api_key:
            return self._fallback(match)

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        prompt = {
            "match": {
                "home": match.home_team.name,
                "away": match.away_team.name,
                "stage": match.stage,
                "starts_at": match.starts_at.isoformat(),
            },
            "sports_data": sports_payload or {},
            "instructions": (
                "Use os detalhes da fixture e estatísticas da API-Football quando disponíveis. "
                "Responda obrigatoriamente em português do Brasil (pt-BR). "
                "Retorne somente JSON válido, sem markdown, sem bloco ```json e sem texto fora do JSON. "
                "Campos obrigatórios: summary, suggested_home_score, suggested_away_score, confidence, probabilities. "
                "O campo summary deve ser um texto curto, natural e pronto para usuário final brasileiro. "
                "probabilities deve usar as chaves home, draw e away com percentuais de 0 a 100."
            ),
        }
        response = await client.responses.create(
            model=settings.openai_model,
            input=[
                {
                    "role": "system",
                    "content": (
                        "Você é um analista de futebol para um bolão corporativo brasileiro. "
                        "Escreva sempre em português do Brasil, com tom claro, objetivo e útil. "
                        "Não cite que faltam dados se houver informações básicas do jogo; explique a incerteza de forma natural. "
                        "Retorne apenas JSON válido no formato solicitado."
                    ),
                },
                {"role": "user", "content": json.dumps(prompt, ensure_ascii=False)},
            ],
        )
        try:
            return self._parse_json_response(response.output_text)
        except json.JSONDecodeError:
            fallback = self._fallback(match)
            fallback["summary"] = response.output_text
            return fallback

    @staticmethod
    def _fallback(match: Match) -> dict:
        return {
            "summary": f"Análise indisponível em modo local para {match.home_team.name} vs {match.away_team.name}.",
            "suggested_home_score": 1,
            "suggested_away_score": 1,
            "confidence": 50.0,
            "probabilities": {"home": 34, "draw": 32, "away": 34},
        }

    @staticmethod
    def _parse_json_response(content: str) -> dict:
        text = content.strip()
        fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, flags=re.DOTALL)
        if fence_match:
            text = fence_match.group(1)

        return json.loads(text)
