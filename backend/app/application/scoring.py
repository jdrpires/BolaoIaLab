from dataclasses import dataclass


@dataclass(frozen=True)
class ScoreBreakdown:
    points: int
    exact_score: bool
    correct_winner: bool
    correct_goal_difference: bool


class PredictionScoringService:
    """Enterprise rule object for scoring policies.

    Default rules:
    - 10 points: exact score.
    - 6 points: correct winner/draw and correct goal difference.
    - 4 points: correct winner/draw.
    - 1 point: each exact team score when outcome is not already exact.
    """

    def calculate(self, predicted_home: int, predicted_away: int, actual_home: int, actual_away: int) -> ScoreBreakdown:
        exact_score = predicted_home == actual_home and predicted_away == actual_away
        predicted_outcome = self._outcome(predicted_home, predicted_away)
        actual_outcome = self._outcome(actual_home, actual_away)
        correct_winner = predicted_outcome == actual_outcome
        correct_goal_difference = (predicted_home - predicted_away) == (actual_home - actual_away)

        if exact_score:
            return ScoreBreakdown(points=10, exact_score=True, correct_winner=True, correct_goal_difference=True)

        points = 0
        if correct_winner and correct_goal_difference:
            points += 6
        elif correct_winner:
            points += 4

        if predicted_home == actual_home:
            points += 1
        if predicted_away == actual_away:
            points += 1

        return ScoreBreakdown(
            points=points,
            exact_score=False,
            correct_winner=correct_winner,
            correct_goal_difference=correct_goal_difference,
        )

    @staticmethod
    def _outcome(home: int, away: int) -> str:
        if home > away:
            return "home"
        if away > home:
            return "away"
        return "draw"
