# Teammates

The agent team for this repository: Meio's personal site, its playable Three.js/Rapier mall at `/mall`, and the dev-only Ride Lab. All agent work routes through here.

Meio approves scope, art, merges, releases and deployments. Nothing ships until Meio has personally seen it working. The PM is Meio's single point of contact and coordinates everyone else.

## Starting or resuming a session

1. Start as the **PM** ([roles/pm.md](roles/pm.md)) unless Meio named another role.
2. Pick the work: a project in `projects/` or a one-off in `oneoffs/`. If none fits, ask Meio whether it is a project or a one-off before creating it.
3. Read that folder: `assignment.md` (scope and authority), `decisions.md` (what is settled), `state.md` (where things stand and the resumption point). Then read any tracker it links.
4. Dispatch teammates by role with the bindings below. Each teammate reads its role file and [skills.md](skills.md) first.
5. At handoff, update `state.md` and the linked tracker. Record new decisions in `decisions.md`.

## Roster

| Role | Owns |
| --- | --- |
| [PM](roles/pm.md) | Coordination, sequencing, evidence checks, reporting to Meio |
| [Architect](roles/architect.md) | Technical direction, plans, decisions |
| [Developer](roles/developer.md) | Runtime code: loading, placement, physics, shaders, bounded secondary motion |
| [QA](roles/qa.md) | Independent verification of delivered work |
| [3D Artist](roles/3d-artist.md) | Sole Blender operator; everything up to a working, documented GLB |
| [Art Director](roles/art-director.md) | References, gold baselines, art registry, review panel, acceptance prep. Never edits Blender scenes |

## Bindings

| Teammate | Provider | Model | Effort |
| --- | --- | --- | --- |
| PM | Claude | claude-opus-5-5 | session |
| Architect | Claude | claude-opus-5-5 | medium |
| Developer | Codex | gpt-6.1-sol | low |
| QA | Codex | gpt-6.1-sol | low |
| 3D Artist | Codex (personal ChatGPT instance) | gpt-6-astra | medium |
| Art Director | Codex | gpt-6.1-sol | medium |
| Art review panel | Claude + Codex | claude-opus-5-5 + gpt-6.1-sol | — |

If a bound model or provider is unavailable, tell Meio. Never silently substitute another.

## Layout

```
teammates/
  README.md        this file
  skills.md        preferred skills per role
  roles/           one file per role
  projects/<project>/
    assignment.md  scope, what is approved, what needs Meio
    state.md       disposable current state only: focus, running teammates (thread links),
                   blockers and decisions waiting on Meio, resumption point. Not a diary.
    decisions.md   durable decisions ledger (this repo has no Linear)
  oneoffs/<oneoff>/
    state.md       one-line scope at the top. Archive or delete when done;
                   promote to projects/ if it grows.
```

If a project has a task tracker elsewhere (for example `docs/ride-lab/RIDER_EPIC.md`), that tracker owns task status. `state.md` points to it and does not copy it.

## Evidence

There is no CI and no Linear. Evidence is local and tied to the exact revision:

- `npm run lint`, `npm run typecheck`
- `npm run test:mall`, `npm run test:ride-lab`
- `npm run verify:ride-lab:assets`, `npm run verify:ride-lab`, `npm run verify:ride-lab:production` (and `npm run lint:ride-lab`)
- Browser journeys with Playwright and before/after screenshots
- For art: asset checkpoints with SHA256, frozen renders from fixed views, and Meio's acceptance quote

## Projects

- [ride-lab-rider](projects/ride-lab-rider/) — the rider epic (R01–R15).

## Shared machine

This 16 GB Mac is shared with other agent sessions. Run heavy local work through `heavy-slot --label <name> -- <command>` (on the PATH; `heavy-slot --status` shows who holds slots). Heavy means installs, `npm run build`, full test/typecheck runs, `verify:ride-lab*` browser scripts, and command-line Blender renders/exports. Exit 76 means the job was stopped for memory: report it to the PM and don't retry right away. Stop servers and close Blender instances you started when you finish.

## Rules of the house

- [gates.md](gates.md) defines accepted and ready. [ownership.md](ownership.md) lists hands-off rules.
- `state.md` is current-only: replace lines, commit meaningful changes in small commits. `decisions.md` is append-only with dates and Meio's words.
- Commit only `assignment.md`, `state.md` and `decisions.md` per project; bulky or private material goes in gitignored `evidence/`, `briefs/`, `scratch/`.
- No secrets, API keys or personal data in the repo.
