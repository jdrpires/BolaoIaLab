from dataclasses import dataclass


@dataclass(frozen=True)
class ScoreBreakdown:
    points: int
    exact_score: bool
    correct_winner: bool
    correct_goal_difference: bool
    underdog_bonus: bool = False


@dataclass(frozen=True)
class ScoringRules:
    exact_score_points: int = 10
    winner_points: int = 4
    draw_points: int = 4
    goal_difference_points: int = 2
    team_score_points: int = 1
    underdog_bonus_points: int = 0


class PredictionScoringService:
    """Enterprise rule object for scoring policies.

    Default rules:
    - 10 points: exact score.
    - 6 points: correct winner/draw and correct goal difference.
    - 4 points: correct winner/draw.
    - 1 point: each exact team score when outcome is not already exact.
    """

    def __init__(self, rules: ScoringRules | None = None) -> None:
        self.rules = rules or ScoringRules()

    def calculate(
        self,
        predicted_home: int,
        predicted_away: int,
        actual_home: int,
        actual_away: int,
        underdog_outcome: str | None = None,
    ) -> ScoreBreakdown:
        exact_score = predicted_home == actual_home and predicted_away == actual_away
        predicted_outcome = self._outcome(predicted_home, predicted_away)
        actual_outcome = self._outcome(actual_home, actual_away)
        correct_winner = predicted_outcome == actual_outcome
        correct_goal_difference = (predicted_home - predicted_away) == (actual_home - actual_away)
        underdog_bonus = bool(correct_winner and underdog_outcome and actual_outcome == underdog_outcome)

        if exact_score:
            return ScoreBreakdown(
                points=self.rules.exact_score_points + (self.rules.underdog_bonus_points if underdog_bonus else 0),
                exact_score=True,
                correct_winner=True,
                correct_goal_difference=True,
                underdog_bonus=underdog_bonus,
            )

        points = 0
        if correct_winner:
            points += self.rules.draw_points if actual_outcome == "draw" else self.rules.winner_points
            if correct_goal_difference:
                points += self.rules.goal_difference_points

        if predicted_home == actual_home:
            points += self.rules.team_score_points
        if predicted_away == actual_away:
            points += self.rules.team_score_points
        if underdog_bonus:
            points += self.rules.underdog_bonus_points

        return ScoreBreakdown(
            points=points,
            exact_score=False,
            correct_winner=correct_winner,
            correct_goal_difference=correct_goal_difference,
            underdog_bonus=underdog_bonus,
        )

    @staticmethod
    def _outcome(home: int, away: int) -> str:
        if home > away:
            return "home"
        if away > home:
            return "away"
        return "draw"
