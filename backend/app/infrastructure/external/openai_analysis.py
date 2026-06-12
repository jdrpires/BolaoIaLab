import json
import re

from openai import AsyncOpenAI

from app.core import get_settings
from app.domain.entities import Match


class OpenAIGameAnalysisClient:
    async def analyze(self, match: Match, sports_payload: dict | None = None) -> dict:
        settings = get_settings()
        if not settings.openai_api_key:
            return self._fallback(match, sports_payload)

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
                "Campos obrigatórios: summary, suggested_home_score, suggested_away_score, confidence, probabilities, "
                "conservative_prediction, bold_prediction, upset_risk, factors, data_sources. "
                "O campo summary deve ser um texto curto, natural e pronto para usuário final brasileiro. "
                "probabilities deve usar as chaves home, draw e away com percentuais de 0 a 100. "
                "conservative_prediction e bold_prediction devem ter: home_score, away_score, label, rationale. "
                "upset_risk deve ter: level (baixo, médio ou alto), percentage e rationale. "
                "factors deve ser uma lista de 4 a 6 itens com title, impact (casa, empate, fora ou neutro) e explanation. "
                "data_sources deve indicar se usou API-Football, estatísticas reais, fixture e inferência da IA."
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
            fallback = self._fallback(match, sports_payload)
            fallback["summary"] = response.output_text
            return fallback

    @staticmethod
    def _fallback(match: Match, sports_payload: dict | None = None) -> dict:
        return {
            "summary": f"Análise indisponível em modo local para {match.home_team.name} vs {match.away_team.name}.",
            "suggested_home_score": 1,
            "suggested_away_score": 1,
            "confidence": 50.0,
            "probabilities": {"home": 34, "draw": 32, "away": 34},
            "conservative_prediction": {
                "label": "Palpite conservador",
                "home_score": 1,
                "away_score": 1,
                "rationale": "Sem dados reais disponíveis no ambiente local, o empate reduz exposição ao erro.",
            },
            "bold_prediction": {
                "label": "Palpite ousado",
                "home_score": 2,
                "away_score": 1,
                "rationale": "Cenário alternativo com leve vantagem para o mandante.",
            },
            "upset_risk": {
                "level": "médio",
                "percentage": 34,
                "rationale": "A falta de estatísticas recentes aumenta a incerteza do confronto.",
            },
            "factors": [
                {
                    "title": "Dados esportivos",
                    "impact": "neutro",
                    "explanation": "A análise local não encontrou estatísticas reais suficientes para pesar um lado.",
                },
                {
                    "title": "Mando de campo",
                    "impact": "casa",
                    "explanation": "O time mandante recebe uma pequena vantagem inicial no cenário base.",
                },
            ],
            "data_sources": {
                "api_football": bool(sports_payload),
                "fixture": bool(sports_payload and sports_payload.get("fixture")),
                "statistics": bool(sports_payload and sports_payload.get("statistics")),
                "ai_inference": True,
            },
        }

    @staticmethod
    def _parse_json_response(content: str) -> dict:
        text = content.strip()
        fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, flags=re.DOTALL)
        if fence_match:
            text = fence_match.group(1)

        return json.loads(text)
