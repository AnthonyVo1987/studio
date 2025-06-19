
# StockSage v3.0+ Change History

This document tracks the commit history and significant changes for StockSage starting from version 3.0.0.0.
For changes prior to v3.0.0.0, please refer to `CHANGELOG.md`.

---
## StockSage Application Commit Log (v3.x.x.x)

This section tracks the commit history of the StockSage application, with versions corresponding to the `3.x.x.x` scheme. Latest commits are at the top.

---
**App Version:** `v3.0.0.1` (Documentation Update for Commit `0f667708`)
**Tag:** `Phase-10_Task-Docs_v3.0.0.1_FinalizeDynamicVersioningDocs` (Illustrative Tag)
**Commit Hash:** (To be assigned upon actual commit of these documentation changes)
**Subject:** `docs(readme,changelog): Update README_3.0.md and create CHANGELOG_3.0.md for v3.0.0.1`
**Details:**
This commit finalizes the documentation for application version `v3.0.0.1`. It involves:
1.  **Updating `README_3.0.md`**:
    *   The `README_3.0.md` (Document Version 3.0.1) has been thoroughly updated to reflect the current architecture and PRD of the application as of functional version `v3.0.0.1`.
    *   Key enforcement policies are now clearly documented:
        *   **Dynamic Versioning:** `src/config/app-metadata.json` is the SOLE source of truth for `appVersion`. UI components (`Header`) and export metadata (`DebugConsole`) derive the version dynamically. Hardcoded versions (like the former `APP_VERSION_FOR_EXPORT`) are prohibited and have been removed.
        *   **AI Definition Loading:** AI flows correctly load their JSON definitions using dynamic `import()` for robust path resolution in deployed environments.
        *   **Metadata Timestamps:** `lastUpdatedTimestamp` in `src/config/app-metadata.json` must be a real, valid ISO 8601 timestamp.
    *   This README serves as the clean baseline for v3.0 onwards.
2.  **Creating `CHANGELOG_3.0.md` (This File)**:
    *   This new changelog file is created to track the history of v3.0.x.x versions.
    *   It has been initialized with the detailed commit logs for the functional changes that constituted `v3.0.0.1` (AI definition loading fix and dynamic versioning enforcement fix - from commit `0f667708`).
*No source code files or the `src/config/app-metadata.json` file were modified as part of this documentation-only commit.* Their state reflects the functional changes made in commit `0f667708`.

---
**App Version:** `v3.0.0.1` (Enforce Fully Dynamic Versioning)
**Tag:** `Phase-10_Task-3.0.0.1_DynamicVersioningFix` (Based on user's commit hash `0f667708`)
**Commit Hash:** `0f667708`
**Subject:** `fix(core): Enforce dynamic app versioning, remove hardcoded versions (v3.0.0.1)`
**Details:**
This version (`v3.0.0.1`) implements a critical fix to ensure all application versioning is handled dynamically, sourcing the version from `src/config/app-metadata.json`. This resolves previous inconsistencies and enforces a strict policy against hardcoded versions in UI components or for export metadata.

**Key Changes in v3.0.0.1 (Dynamic Versioning Fix):**

*   **Dynamic Versioning Enforcement:**
    *   `src/components/debug-console.tsx`:
        *   Removed the `APP_VERSION_FOR_EXPORT` constant.
        *   The `DebugConsole` component now accepts an `appVersion: string` prop.
        *   Export helper functions (`getFsmStatesAndTimestampForExport`, `generateLogsTxtWithMetadata`, `generateLogsCsvWithMetadata`) were refactored to accept and use this dynamic `appVersion` prop for embedding in exported log file metadata.
        *   All copy/export handlers in `DebugConsole` now pass the dynamic `appVersion` prop to these helper functions.
    *   `src/components/page-content.tsx`:
        *   The `PageContent` component now passes the `appVersion` prop (which it receives from the `Home` server component, sourced from `app-metadata.json`) to the `DebugConsole` component.
*   **Documentation Updates (Previewed for this commit, formalized in subsequent doc-only commit):**
    *   `README_3.0.md` updated to strictly reflect the new dynamic versioning policy:
        *   `src/config/app-metadata.json` is the sole source of truth for `appVersion`.
        *   All UI displays (Header) and export metadata (DebugConsole logs) derive the application version dynamically from this source.
        *   Hardcoded version constants (like the former `APP_VERSION_FOR_EXPORT`) are prohibited and have been removed.
*   **Metadata (`src/config/app-metadata.json`):**
    *   Remains at `appVersion: "v3.0.0.1"` with its `lastUpdatedTimestamp` from the previous AI definition loading fix, as this commit is part of the `v3.0.0.1` scope.

**Outcome of v3.0.0.1 (Dynamic Versioning Fix):**
*   The application now consistently uses a single source of truth (`src/config/app-metadata.json`) for its version number.
*   All version displays in the UI and versions embedded in exported log files are dynamic and reflect this single source.
*   Hardcoded version constants have been eliminated, reducing the risk of versioning inconsistencies.

---
**App Version:** `v3.0.0.1` (Fix AI Definition Loading for Deployment)
**Tag:** `Phase-10_Task-3.0.0.0_FixAIDefinitionLoading` (Note: Initial task ID was 3.0.0.0, version corrected to 3.0.0.1 by user)
**Commit Hash:** (Part of `0f667708`)
**Subject:** `fix(ai): Use dynamic imports for AI definition JSONs for deployment (v3.0.0.1)`
**Details:**
This version (`v3.0.0.1`) addresses a critical issue where AI flows failed in the deployed App Hosting environment due to an inability to load their prompt/logic definition JSON files. The fix involves changing the loading mechanism in `src/ai/definition-loader.ts` and `src/ai/prompt-loader.ts` from `fs.readFile` with `process.cwd()` to use dynamic `import()` statements with the `@/` alias for robust path resolution.

**Key Changes in v3.0.0.1 (AI Definition Loading Fix):**

*   **AI Definition Loading (`src/ai/definition-loader.ts`, `src/ai/prompt-loader.ts`):**
    *   Modified `loadDefinition` and `loadPromptDefinition` functions to use dynamic `await import(\`@/ai/definitions/\${definitionName}.json\`)`.
    *   Removed direct `fs` and `path` module imports as they are no longer needed for this loading mechanism.
    *   Ensured that the `.default` property of the dynamically imported module is accessed to get the JSON content.
*   **Application Metadata (`src/config/app-metadata.json`):**
    *   `appVersion` updated to `v3.0.0.1`.
    *   `lastUpdatedTimestamp` updated to the current real-world ISO 8601 timestamp (as part of this broader `v3.0.0.1` update sequence).
*   **Debug Console (`src/components/debug-console.tsx`):**
    *   `APP_VERSION_FOR_EXPORT` was updated to `v3.0.0.1` (this was later corrected to be fully dynamic in a subsequent part of the `0f667708` commit).

**Outcome of v3.0.0.1 (AI Definition Loading Fix):**
*   AI flows should now correctly load their JSON definitions in the Firebase App Hosting environment, resolving the `ENOENT` errors and enabling AI functionalities.
*   The application version is officially `v3.0.0.1`.

---
