# Ride Lab rider: assignment

## Scope

The rider epic, tasks R01–R15, exactly as written in [docs/ride-lab/RIDER_EPIC.md](../../../docs/ride-lab/RIDER_EPIC.md): fit the existing manga character to the accepted green scooter, make the rider respond naturally to riding, and bring the result into a working local Ride Lab browser preview.

That map is the only task tracker. Its resume state and task statuses are authoritative; this folder does not copy them.

## Approved now

- Harness setup (`teammates/`).
- The read-only art checkpoint audit by the 3D Artist, writing `docs/ride-lab/checkpoint-audit-2026-11-20.md`. Read-only means no deletion, moving or editing of checkpoints.

## Needs Meio's approval

- Gold baselines.
- Final art acceptance (parts, assets, poses, the playable result).
- Any deletion, including checkpoint cleanup.
- Git LFS migration.
- Commits to shared branches, merges, deploys, and promotion to the homepage.

## Team and bindings

| Teammate | Provider | Model | Effort |
| --- | --- | --- | --- |
| PM | Claude | claude-opus-5-5 | session |
| Architect | Claude | claude-opus-5-5 | medium |
| Developer | Codex | gpt-6.1-sol | low |
| QA | Codex | gpt-6.1-sol | low |
| 3D Artist | Codex (personal ChatGPT instance) | gpt-6-astra | medium |
| Art Director | Codex | gpt-6.1-sol | medium |
| Art review panel | Claude + Codex | claude-opus-5-5 + gpt-6.1-sol | — |

If a bound model is unavailable, tell Meio. Never silently substitute.

## Key sources

- Tracker: [docs/ride-lab/RIDER_EPIC.md](../../../docs/ride-lab/RIDER_EPIC.md)
- Entry point: [docs/ride-lab/README.md](../../../docs/ride-lab/README.md)
- Authoring decision: [ADR 0001](../../../docs/adr/0001-blender-mcp-native-asset-authoring.md)
- Gold/candidate registry: [docs/art/ride-lab-character-context.md](../../../docs/art/ride-lab-character-context.md)
