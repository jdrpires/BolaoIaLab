from app.application.scoring import PredictionScoringService, ScoringRules


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


def test_draw_uses_draw_points_and_goal_difference_bonus() -> None:
    result = PredictionScoringService().calculate(1, 1, 2, 2)

    assert result.points == 6
    assert result.correct_winner is True
    assert result.correct_goal_difference is True


def test_custom_rules_are_used() -> None:
    service = PredictionScoringService(
        ScoringRules(
            exact_score_points=12,
            winner_points=5,
            draw_points=3,
            goal_difference_points=4,
            team_score_points=2,
            underdog_bonus_points=0,
        )
    )

    result = service.calculate(3, 1, 2, 0)

    assert result.points == 9


def test_underdog_bonus_is_added_when_outcome_matches_zebra() -> None:
    service = PredictionScoringService(ScoringRules(underdog_bonus_points=3))

    result = service.calculate(1, 0, 2, 1, underdog_outcome="home")

    assert result.points == 9
    assert result.underdog_bonus is True
