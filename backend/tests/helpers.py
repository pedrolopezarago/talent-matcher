from backend.app.models import Brief, Requirement, Role


def req(id, type="skill", value="Python", must=True, level=None, weight=1, synonyms=None):
    return Requirement(id=id, type=type, value=value, level=level, must=must, implicit=False, weight=weight,
                       source_quote=value, synonyms=synonyms or [])


def role(reqs, id="r1", title="Backend Developer Java", min_years=None, headcount=1, criticality=3, review_depth=100):
    return Role(id=id, title=title, headcount=headcount, min_years=min_years, criticality=criticality,
                review_depth=review_depth, requirements=reqs)


def brief(roles, start_date=None):
    return Brief(title="t", summary="s", start_date=start_date, immediate=start_date is None, roles=roles)
