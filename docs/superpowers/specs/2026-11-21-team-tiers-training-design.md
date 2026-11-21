# Team tiers (one expert per team) + training plans — short design

Date: 2026-11-21 · Requested by Dani (backend).

**Why:** real NTT DATA staffing puts ONE expert on a team and the rest Junior/Mid people who do most of the hands-on work; people who join without fully meeting a requirement (because nobody better was free) need targeted upskilling.

**Decided by Dani:** one expert per **team** (not per role).

**My calls:**
- Expert = Senior/Lead/Principal; support = Junior/Mid (Trainee excluded).
- Optimal: try the expert slot in each role, solve the rest with `linear_sum_assignment`, keep the variant with the fewest off-level slots, then the highest score. Greedy baseline: expert in the most critical role.
- A slot with nobody at the right level is filled with another level and flagged `off_tier` (never left empty when someone exists).
- Retrieval: two pools per role (experts / Junior-Mid), half the depth each; judging takes the best half of `JUDGE_TOP_N` from each tier. Same LLM cost.
- Training: for team members with any MUST requirement not fully met; one Haiku call for the whole team; template fallback. Nice-to-haves never trigger training.

**Approaches considered:** per-role expert (rejected by Dani); penalty-only optimisation without trying each expert placement (can't guarantee exactly one expert); rule-based training catalogue (rejected: too generic, no catalogue data).

**Contract (additive):** `TeamSlot.tier?`, `TeamSlot.seniority?`, `TeamSlot.off_tier?`, `TeamResult.training?: TrainingPlan[]`.
