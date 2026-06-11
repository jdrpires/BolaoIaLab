import asyncio
from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from app.domain.entities import Company, Match, Team, User, UserRole
from app.infrastructure.db.session import AsyncSessionLocal


COMPANIES = [
    ("Onovolab", "onovolab", "onovolab.com.br", "#a855f7"),
    ("AI Hub", "ai-hub", "aihub.example", "#22d3ee"),
    ("Code Synergy", "code-synergy", "codesynergy.example", "#ec4899"),
    ("QuantumByte", "quantum-byte", "quantumbyte.example", "#10b981"),
]

TEAMS = [
    ("Onovolab United", "ONV"),
    ("AI Hub Stars", "AIH"),
    ("Code Synergy FC", "CSY"),
    ("QuantumByte", "QBT"),
]


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        companies_by_slug = {}
        for name, slug, domain, color in COMPANIES:
            company = (await session.execute(select(Company).where(Company.slug == slug))).scalar_one_or_none()
            if company is None:
                company = Company(name=name, slug=slug, domain=domain, color=color)
                session.add(company)
            companies_by_slug[slug] = company

        await session.flush()

        admin = (await session.execute(select(User).where(User.email == "admin@onovolab.com.br"))).scalar_one_or_none()
        if admin is None:
            session.add(
                User(
                    email="admin@onovolab.com.br",
                    full_name="Admin Bolao IA",
                    company_id=companies_by_slug["onovolab"].id,
                    role=UserRole.ADMIN,
                )
            )

        jean_admin = (await session.execute(select(User).where(User.email == "jean.pires@codesynergy.com.br"))).scalar_one_or_none()
        if jean_admin is None:
            session.add(
                User(
                    email="jean.pires@codesynergy.com.br",
                    full_name="Jean Pires",
                    company_id=companies_by_slug["code-synergy"].id,
                    role=UserRole.ADMIN,
                )
            )
        else:
            jean_admin.full_name = jean_admin.full_name or "Jean Pires"
            jean_admin.company_id = companies_by_slug["code-synergy"].id
            jean_admin.role = UserRole.ADMIN
            jean_admin.is_active = True

        teams_by_short = {}
        for name, short in TEAMS:
            team = (await session.execute(select(Team).where(Team.short_name == short))).scalar_one_or_none()
            if team is None:
                team = Team(name=name, short_name=short)
                session.add(team)
            teams_by_short[short] = team

        await session.flush()

        starts_at = datetime.now(UTC) + timedelta(days=7)
        existing = (await session.execute(select(Match).limit(1))).scalar_one_or_none()
        if existing is None:
            session.add_all(
                [
                    Match(
                        home_team_id=teams_by_short["ONV"].id,
                        away_team_id=teams_by_short["AIH"].id,
                        starts_at=starts_at,
                        stage="Fase de Grupos",
                    ),
                    Match(
                        home_team_id=teams_by_short["CSY"].id,
                        away_team_id=teams_by_short["QBT"].id,
                        starts_at=starts_at + timedelta(hours=2),
                        stage="Fase de Grupos",
                    ),
                ]
            )

        await session.commit()


if __name__ == "__main__":
    asyncio.run(seed())
