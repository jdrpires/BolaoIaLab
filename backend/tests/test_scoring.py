from app.application.scoring import PredictionScoringService


def test_exact_score_gets_ten_points() -> None:
    result = PredictionScoringService().calculate(2, 1, 2, 1)

    assert result.points == 10
    assert result.exact_score is True


def test_correct_winner_and_goal_difference_gets_six_plus_team_score_bonus() -> None:
    result = PredictionScoringService().calculate(3, 1, 2, 0)

    assert result.points == 6
    assert result.correct_winner is True
    assert result.correct_goal_difference is True


def test_wrong_outcome_can_still_receive_team_score_bonus() -> None:
    result = PredictionScoringService().calculate(1, 0, 1, 2)

    assert result.points == 1
    assert result.correct_winner is False
