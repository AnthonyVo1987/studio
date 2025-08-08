# Macro Orchestration: Options, Ranking, and Recommended Path

## Context

- 4-step workflow: Fetch Expirations → Get Stock Data → AI Key Takeaways → AI Options.
- Current macro UI (`src/components/macro-orchestrator/simple-analyze-all-button.tsx`) implements ad‑hoc orchestration: polling to wait for state propagation, ref/state synchronization, manual cancellation flags, and atomic ref writes.
- Robust infra already exists:
  - Service orchestrator layer: `src/lib/xstate/services/macro-services.ts` (timeouts, retries, cancellation, step registry).
  - XState v5 macro machine: `src/lib/xstate/machines/macro-execution-machine.ts` and React hooks in `src/lib/xstate/react/hooks/*`.
  - NVDA/SPY tabs and contexts remain the protected, stable baseline.


## Core problems in the current macro button
- Race conditions and ref/state drift that require polling loops to stabilize expiration selection.
- Manual cancellation via refs; fragmented retry/timeout behavior across steps.
- Progress and error reporting reimplemented at the UI layer rather than owned by an orchestration primitive.


## Evaluation criteria
- Robustness: race-free sequencing, retries/backoff, cancellation, deterministic transitions.
- Integration effort: changes required in the main UI/tabs and contexts.
- Observability: progress, metrics, structured errors.
- Testability: unit/integration coverage of the orchestrator and steps.
- Extensibility: conditional branches, parallel steps, pause/resume, per-step retry.
- Risk: impact radius, regression potential.


## Options (shortlist)

1) XState macro-only integration (keep UI/contexts; wire machine to 4 steps)
- Pros: High robustness (guards/retries/cancel); strong observability; aligns with existing v5 infra; machine owns transitions and progress.
- Cons: Medium effort to bind steps and surface machine state to UI.

2) Adopt MacroServiceOrchestrator behind the button
- Pros: Immediate stability via centralized timeouts/retries/cancel; low-medium effort; minimal UI churn; easy stepping stone to machines later.
- Cons: Less declarative than a state machine; progress/cancel are still surfaced procedurally unless wrapped.

3) Light in-house FSM (custom reducer/statechart just for macro)
- Pros: Small surface, no new lib.
- Cons: Re-implements orchestration concerns; risks drifting back to ad‑hoc patterns.

4) Robot3 minimal FSM (alternative FSM library)
- Pros: Lightweight, clear guards/invoke model.
- Cons: Introduces a new lib and patterns; less aligned with the existing XState v5 investment.

Other considered
- Full XState layer (beyond macro): robust but high scope—defer until macro-only proves out.
- RxJS pipeline orchestrator: good cancellation and sequencing; branching/error policy becomes complex.


## Ranking (highest to lowest)
1. XState macro-only integration
2. MacroServiceOrchestrator behind the button
3. Full XState layer (later phase)
4. Robot3 minimal FSM
5. Light custom FSM
6. RxJS pipeline
7. Current ad‑hoc macro


## Recommended path (phased)

Phase 1: Service orchestrator swap-in (quick win)
- Replace button’s step execution logic with `defaultOrchestrator.executeAll(...)` from `src/lib/xstate/services/macro-services.ts`.
- Keep existing NVDA/SPY step handlers; pass them via orchestrator options; rely on built-in timeouts/retries/cancellation.
- Surface progress and errors from orchestrator result; remove polling/ref-atomic updates and manual cancel flags.

Phase 2: XState macro-only machine
- Wrap the service orchestrator calls inside the XState macro machine (`macro-execution-machine.ts`).
- Map step start/complete/fail/timeout to machine events; use guards like `hasValidExpiration` and `canExecuteStep`.
- Bind UI to machine snapshot (progress, step state, cancel/retry) via `@xstate/react` hooks; drop bespoke synchronization from UI.

Phase 3: Optional enhancements
- Conditional branches (skip/force per step), per-step retry limits, pause/resume, parallel preparation steps.
- Machine-driven UX affordances (retry a failed step inline, skip step with reason, diagnostics export).


## Acceptance criteria
- No polling loops or ref/state atomic hacks in macro UI; a single source of truth owns step progression.
- Deterministic cancellation (one event) and bounded retries with backoff.
- Consistent progress & error surfaces (machine snapshot or orchestrator results) usable by the UI.
- NVDA/SPY contexts and handlers remain intact; the macro layer orchestrates them.


## Implementation notes
- Files involved:
  - UI: `src/components/macro-orchestrator/simple-analyze-all-button.tsx`
  - Services: `src/lib/xstate/services/macro-services.ts`
  - Machine: `src/lib/xstate/machines/macro-execution-machine.ts`
  - Hooks: `src/lib/xstate/react/hooks/*`
  - Tabs: `src/components/nvda-tab-content.tsx`, `src/components/spy-tab-content.tsx`
- Start with a thin adapter that translates orchestrator step results to machine events, then progressively move step logic under `invoke` in the machine.


## Risk & mitigation
- Risk: UI regressions due to event wiring.
  - Mitigation: Retain existing handlers and context usage; add a toggle flag to switch between orchestrator-only and machine-driven flows.
- Risk: Step mismatch (e.g., expiration mismatch on server responses).
  - Mitigation: Validate step outputs within machine actions and fail fast with actionable messages.


## Next actions
1. Implement Phase 1 adapter in the button component; remove polling and ref atomic updates.
2. Introduce a macro machine actor for start/cancel/retry; wire to the adapter.
3. Migrate step-by-step from adapter to machine `invoke` services.


