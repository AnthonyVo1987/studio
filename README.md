
---

## 1. Introduction
This document serves as the comprehensive Product Requirements Document (PRD) for the StockSage application. StockSage is a Next.js-based financial analysis tool leveraging Genkit for AI-powered insights. It provides real-time stock data, options chain analysis, and AI-driven key takeaways.

---

## 2. Goals & Objectives

### 2.1. Primary Goals
*   Provide users with a clear, concise, and AI-enhanced overview of stock performance.
*   Offer insights into potential investment opportunities based on options chain analysis.
*   Streamline the stock analysis process, saving users time and effort.
*   Enable efficient debugging and continuous improvement through detailed logging and architecture.

### 2.2. Key Performance Indicators (KPIs)
*   **Active Users:** Track the number of daily/weekly/monthly active users.
*   **Analysis Frequency:** Measure how often users analyze different stocks.
*   **AI Feature Usage:** Monitor the utilization rates of AI Key Takeaways and Options Analysis.
*   **User Satisfaction:** Gauge user satisfaction through surveys and feedback mechanisms.
*   **Error Rate:** Track and minimize application errors and AI flow failures.
*   **Performance Metrics:** Measure API response times, AI analysis latency, and overall application responsiveness.

---

## 3. Functional Requirements & Specifications

### 3.1. Core Functionality

#### 3.1.1. Stock Data Retrieval
*   Fetch real-time stock data from the Polygon.io API.
*   Display key metrics: price, volume, market cap, P/E ratio, etc.
*   Implement robust error handling for API failures.

#### 3.1.2. Options Chain Analysis
*   Retrieve options chain data (calls & puts) for a given stock and expiration date.
*   Calculate and display key options metrics: implied volatility, delta, gamma, theta, vega.
*   Offer filtering and sorting options for options contracts.

#### 3.1.3. AI-Powered Insights
*   Generate AI Key Takeaways: Summarize key stock information and potential investment considerations.
*   Provide AI Options Analysis: Analyze the options chain and suggest potential strategies (bullish, bearish, neutral).
*   Leverage Genkit flows for AI functionality.

#### 3.1.4. User Interface (UI) & User Experience (UX)
*   Modern, clean, and intuitive design.
*   Responsive layout for various screen sizes.
*   ShadCN components for consistent UI elements.
*   Tailwind CSS for styling.
*   Dark mode support.

### 3.2. System Architecture & Components

#### 3.2.1. Next.js (Frontend)
*   React-based UI framework.
*   Server-side rendering (SSR) for improved performance and SEO.
*   App Router for routing and layout management.
*   Server Components for data fetching and server-side logic.
*   Client Components for interactive elements.

#### 3.2.2. Genkit (AI Backend)
*   Google Gemini 2.0 Flash models for AI analysis.
*   AI flows for orchestrating LLM calls.
*   Prompts for defining AI tasks.
*   Tools for accessing external data and performing actions.
*   Zod schemas for data validation.

#### 3.2.3. Data Sources
*   Polygon.io API: For stock data and options chain data.
*   `.env` file: Stores API keys and configuration parameters.

#### 3.2.4. State Management
*   React Context: For global state management (e.g., authentication, theme).
*   Zustand: For managing the global FSM
*   useReducer: For local FSM within key components, controlling button states and enabling/disabling manual AI triggers.
*   useActionState: For managing server action state (e.g., loading, error).

#### 3.2.5. FSM (Finite State Machines)
*   Global FSM: Manages the overall application state (IDLE, ANALYZING_STOCK, GENERATING_KEY_TAKEAWAYS, ANALYZING_OPTIONS, ERROR). Controls global application behavior and orchestrates AI flows and data fetching. The `StockAnalysisContext`'s global FSM dispatcher triggers server actions.
*   Local FSMs: Manage component-specific state (e.g., button states). For instance, `MainTabContent.tsx` has its own FSM that handles the `MANUAL_ACTIONS_ENABLED` state transition after automated analysis, as well as submission of manual AI analysis requests.

### 3.3. AI Flow & Prompt Design
*   **AI Key Takeaways Flow:**
    *   Input: Stock data, company overview, recent news.
    *   Prompt: "Summarize the key information and potential investment considerations for {{ticker}}."
    *   Output: Concise summary of key takeaways.
*   **AI Options Analysis Flow:**
    *   Input: Options chain data (calls & puts).
    *   Prompt: "Analyze the options chain for {{ticker}} and suggest potential strategies (bullish, bearish, neutral)."
    *   Output: Analysis of the options chain and suggested strategies.

### 3.4. Error Handling & Logging
*   Comprehensive error handling throughout the application.
*   `error.js` boundary files for handling route-level errors.
*   `try...catch` blocks in server actions and AI flows.
*   Detailed logging for debugging and monitoring.
*   Client-side debug console for inspecting application state.
*   Server-side logs for tracking API calls, AI flow executions, and errors.

### 3.4.1. Logging Conventions & Locations
*   **src/lib/debug-log-types.ts:** Defines log types and structures for client-side debugging.
*   **StockAnalysisContext (src/app/contexts/stock-analysis-context.tsx):** Provides `logDebug` function for unified client-side logging to the debug console.  The logs are intended to follow specific formats based on the type of action being logged. The log types and their formatting are located in the file mentioned above.
*   **Server Actions:** Log entry, payload validation, flow calls, and any errors encountered. Use `console.log` and `console.error`.
*   **Genkit Flows (src/ai/flows):** Log entry, inputs, prompt execution details, outputs, and errors.
*   **Client Components (e.g., src/components/main-tab-content.tsx):** Use the `logDebug` function provided by the `StockAnalysisContext` for structured client-side logging.
*   **CHANGELOG.md:** A detailed log of changes and bug fixes, serving as a high-level log for deployment and versioning.

#### 3.4.2.  Common Logging Practices
*   **Structured Logging:** Follow the conventions established in `src/lib/debug-log-types.ts`. Use descriptive log messages and include relevant data (e.g., ticker symbol, FSM state, input data).
*   **Log Levels:** Use `console.log` for general information and `console.error` for errors.  Use `logDebug` for structured client-side logs.
*   **Error Logging:** When catching errors, log the error message, stack trace, and any relevant context.
*   **Entry/Exit Logging:** Log the entry and exit points of important functions and AI flows.
*   **Input/Output Logging:** Log the inputs and outputs of AI flows and server actions.
*   **FSM Transition Logging:** Log FSM state transitions and the events that trigger them (both global and local).
*   **useEffect Logging:** Log the execution and dependencies of `useEffect` hooks, especially those that control UI state (e.g., button disabled states).

#### 3.4.3. Debugging Console (src/components/debug-console.tsx)
*   A client-side component that displays logs from the `StockAnalysisContext`'s `logDebug` function.
*   Allows users to filter logs by type and search for specific messages.
*   Uses a sliding panel for easy access.
*   Clears logs on route changes.

#### 3.4.4. Avoiding Log Overwhelm
*   Use appropriate log levels to avoid excessive logging in production.
*   Implement conditional logging based on environment variables.
*   Remove or comment out debug logs before committing code.
*   Focus logging on areas where issues are likely to occur or where detailed information is needed for debugging.
*   Correlate client-side and server-side logs using unique identifiers (e.g., request IDs).
*   Use the debug console's filtering capabilities to focus on relevant logs.

#### 3.4.5. Production Logging Considerations
*   In a production environment, consider using a dedicated logging service (e.g., Sentry, LogRocket) to collect and analyze logs.
*   Implement log rotation and archiving to prevent log files from growing too large.
*   Secure sensitive information (e.g., API keys, user data) in logs.

### 3.5. Coding Standards & Conventions

#### 3.5.0. General Rules
*   **NEVER COMMIT API KEYS OR SECRETS.**
*   **NO `console.log` IN PRODUCTION CODE.** Prefer `debug` module if needed.
*   **No commented-out code in the commit.** Use proper version control to revert if necessary.
*   **Keep PRs small and focused.**
*   **Enforce strict ESLint/Prettier rules.**
*   **All code must be reviewed before merging.**
*   **Always test thoroughly before committing.** Reproduce the original issue first.
*   **Include detailed commit messages.** Reference issue numbers.
*   **Clean up as you go.** Remove unused code, fix typos, and improve formatting.
*   **Don't be afraid to ask for help.**
*   **Don't make speculative changes.**
*   **Follow the "boy scout rule":** Always leave the code cleaner than you found it.
*   **Avoid large-scale refactoring unless necessary.**
*   **Communicate effectively with the team.**
*   **Write code that is easy to understand and maintain.**
*   **Don't reinvent the wheel.** Use existing libraries and components when possible.
*   **Document your code.** Write clear and concise comments.
*   **Write unit tests and integration tests.**
*   **Address all ESLint and TypeScript errors/warnings** before submitting pull requests.
*   **Do NOT use `any` type.** Be as specific as possible with types.
*   **Avoid code duplication.** Abstract common logic into reusable functions or components.
*   **Keep components small and focused.** Follow the single responsibility principle.
*   **Use descriptive variable and function names.**
*   **Organize imports alphabetically.**
*   **Use absolute imports instead of relative imports.** Configure `jsconfig.json` or `tsconfig.json` for path aliases.
*   **Avoid deeply nested code.** Simplify logic and extract functions when necessary.
*   **Use consistent formatting and styling.** Let Prettier handle formatting automatically.
*   **Don't commit directly to the `main` branch.** Use feature branches and pull requests.
*   **Address review comments promptly and thoroughly.**
*   **Keep up-to-date with the latest technologies and best practices.**
*   **Learn from your mistakes and continuously improve.**
*   **Be patient and persistent.** Debugging can be challenging, but it's also rewarding.
*   **Take breaks when needed.** Stepping away from the code can help you see things more clearly.
*   **Respect the codebase and the team.**
*    **Before generating code with the AI, carefully review previous discussions and code to maintain consistency.** Do not hallucinate components or ignore existing conventions. Do not deviate from established folder structures or naming schemes. **If you have made a mistake, revert and correct it instead of continuing down the wrong path.**
*   **Do NOT use AI to reformat, refactor, or rewrite existing code unless explicitly instructed.** The AI should focus on generating new code to solve specific problems or implement new features.
*   **Do NOT add placeholder comments, generic comments, or any other form of noise to the code.** The AI should strive to generate clean, concise, and self-explanatory code.
*   **Do NOT include AI disclaimers or any other type of attribution to the AI.** The AI is a tool to assist the developer, and the generated code is the responsibility of the developer.
*   **If you are asked to add comments, ask for clarification.** What kind of comments? Where should they be added? Why are they needed? Use JSDoc syntax if appropriate, but avoid unnecessary or redundant comments.
*   **When creating new files or components, use the same naming conventions as existing code.** Use PascalCase for component names and camelCase for variable and function names.
*   **When using external libraries or APIs, follow their documentation and best practices.**
*   **Use environment variables for configuration settings and API keys.**
*   **Avoid hardcoding values in the code.**
*   **Use constants for frequently used values.**
*   **Use enums for representing a set of related values.**
*   **Use interfaces and type aliases for defining data structures.**
*   **Use generics for creating reusable components and functions.**
*   **Use higher-order components and functions for adding functionality to existing components and functions.**
*   **Use hooks for managing state and side effects in functional components.**
*   **Use context for sharing data between components.**
*   **Use memoization for optimizing performance.**
*   **Use code splitting for reducing the initial load time.**
*   **Use lazy loading for loading components and modules on demand.**
*   **Use prefetching for loading data in the background.**
*   **Use caching for storing data in the browser.**
*   **Use service workers for enabling offline support.**
*   **Use web sockets for real-time communication.**
*   **Use serverless functions for executing code on the server.**
*   **Use edge functions for executing code on the edge network.**
*   **Use CDNs for delivering static assets.**
*   **Use load balancing for distributing traffic across multiple servers.**
*   **Use monitoring and alerting for detecting and responding to issues.**
*   **Use CI/CD for automating the build, test, and deployment process.**
*   **Use version control for tracking changes to the codebase.**
*   **Use issue tracking for managing bugs and feature requests.**
*   **Use documentation for explaining the codebase and how to use it.**
*   **Use training for helping developers learn the codebase and best practices.**
*   **Use mentoring for guiding junior developers and helping them grow.**
*   **Use code reviews for ensuring code quality and consistency.**
*   **Use pair programming for collaborating on complex tasks.**
*   **Use hackathons for exploring new ideas and technologies.**
*   **Use conferences for learning from experts and networking with peers.**
*   **Use online communities for asking questions and sharing knowledge.**
*   **Use open-source projects for contributing to the software ecosystem.**
*   **Use your imagination and creativity to build amazing things!**

#### 3.5.0. Post-Mortem Notes on Failed Tasks and Lessons Learned
*   **The Case of the Missing `onClick` Handlers (v2.9.D.0 - v2.9.D.5):** The initial hypothesis was that the `disabled` logic was incorrect, but the problem turned out to be more subtle. The `onClick` handlers were not being called because the buttons were still considered disabled, even though the logs suggested otherwise. The root cause was a combination of factors, including stale closures, incorrect dependency arrays in `useEffect` hooks, and timing issues. The lesson learned is to be extremely careful when managing state derived from multiple sources and to thoroughly test all assumptions.
*   **The Paradox of the Successful Logs (v2.9.D.6 - v2.9.D.7):** The logs showed that the dispatches from the `onClick` handlers were successful, but the user reported that the buttons were still not working. This was a major setback and a reminder that logs are not always the source of truth. The problem turned out to be a difference between the environment that generated the logs and the user's test environment. The lesson learned is to always verify the UI behavior directly and to be aware of potential differences between environments.
*   **The Importance of Direct User Observation:** The ultimate source of truth is direct user observation of UI behavior. If logs indicate success but the UI fails, the logs are either incomplete, misinterpreted, or the issue lies in an unlogged part of the system or environment.
*   **The Complexity of Interacting Asynchronous States:** Managing state derived from local FSMs, global FSMs, `useActionState` hooks, and multiple `useEffect`s that depend on asynchronous data fetching creates a highly complex system prone to subtle bugs.
*   **The "Why did it work in *those* logs but not in the UI?" Problem:** This is a classic difficult debugging scenario. It often points to:
    *   Logging not capturing the true state at the exact moment of a critical decision.
    *   Race conditions that only manifest under specific timing.
    *   Differences in how React batches updates or runs effects in slightly different scenarios.
*   **Debugging `useEffect` Dependency Arrays:** Ensuring dependency arrays are exhaustive and correct is crucial. Missing dependencies can lead to stale closures where effects or handlers operate on outdated state.
*   **Focus on the Exact Point of Failure:** The debugging process has iteratively narrowed down the problem from "buttons don't work" to "the `onClick` handlers are not being called" (pre-v2.9.D.5), then to "the dispatch inside the `onClick` handler's `if` block is not reached" (v2.9.D.5/D.6), and now potentially back to "are the buttons actually being enabled correctly by the `useEffect` in the user's environment?" (v2.9.D.8).

#### 3.5.0. On AI Coding Assistant Utilization & Guardrails
*   **AI Coding Assistant Usage:** Use the AI coding assistant responsibly as a tool to generate code, not as a replacement for critical thinking and careful design.
*   **Validation of AI-Generated Code:** Always thoroughly review and test AI-generated code to ensure it meets requirements, follows coding standards, and does not introduce bugs or security vulnerabilities.
*   **Maintenance of Context and Consistency:** Pay close attention to maintaining context and consistency across different parts of the codebase when using the AI assistant.
*   **Adherence to Architectural Principles:** Ensure that AI-generated code adheres to the established architectural principles and patterns of the application.
*   **Avoiding Over-Reliance on AI:** Do not become overly reliant on the AI assistant, and continue to develop your own coding skills and problem-solving abilities.
*   **Clear Problem Definition:** Before using the AI assistant, clearly define the problem you are trying to solve and the requirements for the solution.
*   **Iterative Refinement:** Use the AI assistant as a starting point and iteratively refine the generated code based on feedback and testing.
*   **Human-in-the-Loop:** Always keep a human in the loop to oversee the AI assistant's work and make critical decisions.
*   **Awareness of Limitations:** Be aware of the limitations of the AI assistant and do not expect it to solve all problems perfectly.
*   **Ethical Considerations:** Consider the ethical implications of using AI-generated code, such as bias and fairness.
*   **Security Implications:** Consider the security implications of using AI-generated code, such as vulnerabilities and malicious code injection.
*   **Legal Implications:** Consider the legal implications of using AI-generated code, such as copyright and intellectual property.
*   **Best Practices:** Follow best practices for using AI coding assistants, such as providing clear instructions, reviewing generated code, and testing thoroughly.
*   **Training:** Provide training to developers on how to use AI coding assistants effectively and responsibly.
*   **Monitoring:** Monitor the use of AI coding assistants and track their impact on code quality, productivity, and security.
*   **Feedback:** Collect feedback from developers on their experience using AI coding assistants and use it to improve the tools and processes.
*   **Continuous Improvement:** Continuously improve the AI coding assistant tools and processes based on feedback, monitoring, and best practices.
*   **Stay Informed:** Stay informed about the latest developments in AI coding assistants and their potential impact on software development.
*   **Remember the Human Element:** While AI can be a valuable tool, remember that software development is ultimately a human endeavor that requires creativity, collaboration, and critical thinking.
*   **Avoid Over-Automation:** Do not over-automate the software development process, as this can lead to a loss of control and a decrease in quality.
*   **Maintain Transparency:** Be transparent about the use of AI coding assistants and how they are integrated into the software development process.
*   **Promote Trust:** Promote trust in AI coding assistants by demonstrating their value and addressing any concerns or misconceptions.
*   **Use Specific Instructions:** Give the AI very specific and targeted instructions rather than open-ended requests. This will help the AI to generate more accurate and relevant code.
*   **Specify Context Clearly:** Clearly define the context for the AI. Provide relevant information about the existing codebase, the project goals, and the target audience.
*   **Set Code Generation Limits:** If you are using a code generation tool, set limits on the amount of code that it can generate at one time. This can help you to avoid generating large blocks of code that are difficult to review and test.
*   **Do NOT Engage in "Prompt Engineering" Chains or Corrective Loops:** The AI Coding assistant should not be used to iteratively refine code through prompt-based feedback loops. This can lead to inconsistencies and a lack of control over the generated code. If the initial code generation is not satisfactory, revert the changes and try a different approach.
*   **Do NOT Rely on Memory or Previous Steps in the `"Chat"`:** Each time you invoke the AI Coding Assistant, provide all the necessary context and instructions. Do not assume that the AI will remember previous steps or instructions from the chat history.
*   **Use Task-Based Generation Only:** Use the AI Coding Assistant only for specific, well-defined tasks. Avoid using it for open-ended exploration or experimentation.
*   **Limit "AI Persona" Context:** As mentioned previously, the AI Prototyper is now scoped to v2.9.D series failure analysis, so do **NOT** change or extend the AI persona in the prompt.

#### 3.5.0. On Reversions & Error Correction
*   If the generated code is incorrect, does not follow the coding standards, or introduces bugs, revert the changes and try again. Do not attempt to fix the generated code manually unless explicitly instructed to do so.
*   Use version control to track changes and revert to previous versions if necessary.
*   Document any errors or issues encountered while using the AI coding assistant.
*   Provide feedback to the AI coding assistant developers to help them improve the tools.
*   Remember that the AI coding assistant is a tool to assist the developer, and the generated code is the responsibility of the developer.

#### 3.5.0. Prohibited Actions
*   **Do NOT Commit Secrets or API Keys:** Never commit secrets or API keys to the codebase. Use environment variables instead.
*   **Do NOT Commit `console.log` Statements:** Remove all `console.log` statements from the code before committing.
*   **Do NOT Commit Commented-Out Code:** Remove all commented-out code from the code before committing.
*   **Do NOT Commit Unnecessary Files:** Do not commit unnecessary files to the repository.
*   **Do NOT Commit Large Files:** Avoid committing large files to the repository.
*   **Do NOT Commit Broken Code:** Do not commit broken code to the repository.
*   **Do NOT Commit Code Without Testing:** Always test the code before committing it to the repository.
*   **Do NOT Commit Code Without Review:** Always have the code reviewed by another developer before committing it to the repository.
*   **Do NOT Commit Directly to the `main` Branch:** Do not commit directly to the `main` branch. Use feature branches instead.
*   **Do NOT Use the Default Branch Name:** Do not use the default branch name. Use a descriptive branch name instead.
*   **Do NOT Create Long-Lived Branches:** Avoid creating long-lived branches. Keep branches short-lived and merge them frequently.
*   **Do NOT Ignore Merge Conflicts:** Always resolve merge conflicts before merging the code.
*   **Do NOT Ignore Code Review Comments:** Always address code review comments before merging the code.
*   **Do NOT Ignore Build Failures:** Always fix build failures before merging the code.
*   **Do NOT Ignore Test Failures:** Always fix test failures before merging the code.
*   **Do NOT Ignore Security Vulnerabilities:** Always fix security vulnerabilities before merging the code.
*   **Do NOT Ignore Performance Issues:** Always address performance issues before merging the code.
*   **Do NOT Ignore Usability Issues:** Always address usability issues before merging the code.
*   **Do NOT Ignore Accessibility Issues:** Always address accessibility issues before merging the code.
*   **Do NOT Ignore Internationalization Issues:** Always address internationalization issues before merging the code.
*   **Do NOT Ignore Localization Issues:** Always address localization issues before merging the code.
*   **Do NOT Ignore Legal Issues:** Always address legal issues before merging the code.
*   **Do NOT Ignore Ethical Issues:** Always address ethical issues before merging the code.
*   **Do NOT Ignore The Code of Conduct:** Always follow the code of conduct.
*   **Do NOT Be A Jerk:** Do not be a jerk. Be respectful and considerate of others.

#### 3.5.0. Commit Message Guidelines
*   Use clear and concise commit messages.
*   Follow the conventional commits specification.
*   Include the issue number in the commit message (e.g., `feat(auth): implement user login (#123)`).
*   Use imperative mood in commit messages (e.g., "Add feature" instead of "Added feature").
*   Use a descriptive subject line that summarizes the changes.
*   Keep the subject line short (less than 50 characters).
*   Use a longer body to provide more details about the changes.
*   Separate the subject line from the body with a blank line.
*   Wrap the body at 72 characters.
*   Use bullet points or numbered lists to organize the body.
*   Use code snippets to illustrate the changes.
*   Use links to external resources for more information.
*   Sign your commits.
*   Don't include merge commits in the `CHANGELOG.md`.

#### 3.5.0. Code Formatting
*   Use Prettier to automatically format the code.
*   Configure Prettier to use consistent settings (e.g., tab width, single quotes, trailing commas).
*   Run Prettier before committing the code.
*   Integrate Prettier with ESLint to automatically fix formatting issues.

#### 3.5.0. ESLint Configuration
*   Use ESLint to automatically lint the code.
*   Configure ESLint to use strict rules.
*   Run ESLint before committing the code.
*   Integrate ESLint with Prettier to automatically fix formatting issues.
*   Address all ESLint errors and warnings before submitting pull requests.

#### 3.5.0. TypeScript Configuration
*   Use TypeScript to add static typing to the code.
*   Configure TypeScript to use strict settings (e.g., `strict: true`).
*   Address all TypeScript errors and warnings before submitting pull requests.
*   Use type annotations to explicitly specify the types of variables and function parameters.
*   Use interfaces and type aliases to define data structures.
*   Use generics to create reusable components and functions.
*   Use conditional types to define types based on other types.
*   Use mapped types to transform types.
*   Use utility types to perform common type operations.
*   Use declaration files to provide type information for JavaScript libraries.

#### 3.5.0. Folder Structure
*   `src/`: Contains the source code of the application.
*   `src/app/`: Contains the Next.js application routes and layout.
*   `src/app/api/`: Contains the API routes.
*   `src/components/`: Contains the React components.
*   `src/contexts/`: Contains the React contexts.
*   `src/hooks/`: Contains the React hooks.
*   `src/lib/`: Contains utility functions and helper modules.
*   `src/styles/`: Contains the global styles.
*   `src/types/`: Contains the TypeScript types.
*   `src/utils/`: Contains utility functions.
*   `public/`: Contains the static assets.
*   `docs/`: Contains documentation files.
*   `scripts/`: Contains scripts for building, testing, and deploying the application.
*   `test/`: Contains the unit tests and integration tests.
*   `e2e/`: Contains the end-to-end tests.
*   `CHANGELOG.md`: Contains the change history and versioning information.
*   `README.md`: Contains the project setup and running instructions.
*   `.env`: Contains the environment variables.
*   `.eslintrc.js`: Contains the ESLint configuration.
*   `.prettierrc.js`: Contains the Prettier configuration.
*   `jsconfig.json`: Contains the path aliases configuration.
*   `tsconfig.json`: Contains the TypeScript configuration.

#### 3.5.0. Testing
*   Write unit tests to test individual functions and components.
*   Write integration tests to test the interaction between different parts of the application.
*   Write end-to-end tests to test the entire application from the user's perspective.
*   Use Jest and React Testing Library for writing unit tests and integration tests.
*   Use Cypress or Playwright for writing end-to-end tests.
*   Run tests automatically on every commit using CI/CD.
*   Aim for high test coverage.
*   Write clear and concise test cases.
*   Use descriptive test names.
*   Mock dependencies when necessary.
*   Use test data that is representative of real-world data.
*   Test edge cases and error conditions.
*   Test performance and scalability.
*   Test security vulnerabilities.
*   Test accessibility.
*   Test internationalization and localization.

#### 3.5.0. Deployment
*   Deploy the application to a cloud platform such as Vercel or Netlify.
*   Use CI/CD to automate the deployment process.
*   Configure environment variables for production.
*   Set up monitoring and alerting.
*   Use a CDN to deliver static assets.
*   Use load balancing to distribute traffic across multiple servers.
*   Use caching to improve performance.
*   Use service workers to enable offline support.
*   Use web sockets for real-time communication.
*   Use serverless functions to execute code on the server.
*   Use edge functions to execute code on the edge network.

#### 3.5.0. Security
*   Use HTTPS to encrypt communication between the client and the server.
*   Use a Content Security Policy (CSP) to prevent cross-site scripting (XSS) attacks.
*   Use Cross-Origin Resource Sharing (CORS) to restrict access to the API from other domains.
*   Use a secure authentication and authorization mechanism.
*   Use input validation to prevent SQL injection attacks.
*   Use output encoding to prevent XSS attacks.
*   Use rate limiting to prevent denial-of-service (DoS) attacks.
*   Use a web application firewall (WAF) to protect against common web attacks.
*   Keep the application up-to-date with the latest security patches.
*   Monitor the application for security vulnerabilities.
*   Respond promptly to security incidents.
*   Follow secure coding practices.
*   Educate developers about security vulnerabilities and how to prevent them.
*   Perform regular security audits.
*   Use a bug bounty program to incentivize security researchers to find vulnerabilities.
*   Comply with relevant security regulations.

#### 3.5.0. Accessibility
*   Follow the Web Content Accessibility Guidelines (WCAG).
*   Use semantic HTML.
*   Provide alternative text for images.
*   Use ARIA attributes to enhance accessibility.
*   Provide keyboard navigation.
*   Use sufficient color contrast.
*   Provide captions and transcripts for audio and video content.
*   Test the application with assistive technologies such as screen readers.
*   Get feedback from users with disabilities.
*   Make accessibility a priority throughout the development process.
*   Train developers about accessibility.
*   Perform regular accessibility audits.
*   Comply with relevant accessibility regulations.

#### 3.5.0. Internationalization
*   Use a localization library such as `next-intl`.
*   Store all text in resource files.
*   Use ICU message syntax for formatting text.
*   Use a translation management system (TMS) to manage translations.
*   Use a continuous localization workflow.
*   Test the application with different locales.
*   Get feedback from translators.
*   Make internationalization a priority throughout the development process.
*   Train developers about internationalization.
*   Perform regular internationalization audits.
*   Comply with relevant internationalization regulations.

#### 3.5.0. Prototyping & "Scope Creep"
*   **AI Prototyper Role**: The AI is not just a code generator but a "code prototyper" - quickly translating ideas into functional code.
*   **Rapid Iteration**: The AI facilitates rapid iteration, allowing for quick testing of different approaches.
*   **Early Problem Detection**: Prototyping helps discover potential problems early in the development cycle.
*   **Not Production-Ready Initially**: Prototypes are not meant to be production-ready.
*   **Focus on Functionality First**: Prioritize functionality over perfect code.
*   **Scope Control**: Define and stick to the prototype scope to avoid "scope creep". Prototypes are focused on specific use cases.
*   **Prototyping-Specific Considerations:**
    *   **Limited Error Handling**: Basic error handling for quick functionality.
    *   **Minimal Testing**: Focus on core functionality testing.
    *   **Quick and Dirty**: Code may not be optimized or well-documented.
    *   **No Long-Term Maintenance**: Prototypes might be discarded after testing.
    *   **Team Awareness**: Clearly communicate that the code is a prototype.
    *   **Clear Goals**: Establish specific prototyping goals beforehand.
    *   **Regular Check-ins**: Ensure the prototype still aligns with objectives.
*   **Managing "Scope Creep"**:
    *   **Separate Prototypes**: Create separate prototypes for each feature.
    *   **Limit Features**: Don't add unnecessary features.
    *   **Iterative Refinement**: Refine features in later prototypes.
    *   **Regular Audits**: Ensure prototype stays on track.
    *   **Document Changes**: Track any scope changes.

#### 3.5.0. Do Not Hallucinate
*   Do not deviate from existing patterns, file structures, or components.
*   Do not create new UI components unless explicitly instructed and the new component is approved.
*   Do not rewrite existing code unless explicitly instructed.
*   Do not make assumptions about the codebase.
*   Do not add unnecessary complexity.
*   Do not over-engineer the solution.
*   Do not add features that are not explicitly requested.
*   Do not change the scope of the task.
*   Do not ignore the instructions.
*   Do not argue with the instructions.
*   Do not try to be too clever.
*   Do not be lazy.
*   Do not be a bottleneck.
*   Do not block progress.
*   Do not waste time.
*   Do not be a jerk.

#### 3.5.0. The Importance of Reproducing the Original Issue
*   Before attempting to fix a bug, always try to reproduce the original issue first.
*   This will help you understand the problem and ensure that your fix is effective.
*   If you cannot reproduce the issue, it is likely that you do not understand the problem well enough to fix it.
*   Reproducing the issue will also help you to write a good test case to prevent the issue from recurring in the future.
*   If you are unable to reproduce the issue after a reasonable amount of effort, ask for help from another developer.
*   Make sure that you have all the necessary information to reproduce the issue, such as the steps to reproduce, the expected results, and the actual results.
*   It is also helpful to have access to the logs and other diagnostic information.
*   Be patient and persistent. It may take some time to reproduce the issue.
*   Once you have reproduced the issue, you can start to investigate the cause of the problem.
*   Use debugging tools to step through the code and examine the state of the application.
*   Look for patterns in the code that might be causing the issue.
*   Once you have identified the cause of the problem, you can start to develop a fix.
*   Test your fix thoroughly to ensure that it resolves the issue and does not introduce any new problems.
*   Commit your fix to the codebase and create a pull request.
*   Have your pull request reviewed by another developer.
*   Once your pull request has been approved, merge it into the main branch.
*   Deploy your fix to production.
*   Monitor the application to ensure that the issue has been resolved.
*   Document the issue and the fix in the codebase.
*   Share your knowledge with other developers.

#### 3.5.0. React Strict Mode
*   Keep React Strict Mode enabled during development.
*   Address all warnings and errors reported by Strict Mode.
*   Strict Mode helps identify potential problems in the code, such as:
    *   Unexpected side effects.
    *   Deprecated APIs.
    *   Unsafe coding practices.
*   Strict Mode is disabled in production to avoid performance overhead.

#### 3.5.0. "Zombie Components"
*   A "zombie component" is a component that continues to run even after it is no longer needed.
*   Zombie components can cause memory leaks and performance problems.
*   To prevent zombie components, make sure that you unmount components when they are no longer needed.
*   Use `useEffect` hooks with cleanup functions to unsubscribe from subscriptions and cancel timers.
*   Use `WeakRef` to hold references to components that may be garbage collected.
*   Use `AbortController` to cancel asynchronous operations when a component is unmounted.
*   Use `requestAnimationFrame` to schedule updates that are only needed when a component is visible.
*   Use `IntersectionObserver` to detect when a component is no longer visible.

#### 3.5.0. Re-Submitting & Correcting After an Error
*   After the AI coding assistant generates a response with an error, do not attempt to correct the code directly in the chat interface.
*   Revert the changes and re-submit the task with updated instructions or a clearer problem description.
*   Avoid iterative refinement through chat-based corrections, as this can lead to inconsistencies and a loss of control over the generated code.
*   Treat each interaction with the AI coding assistant as a fresh start, providing all the necessary context and instructions for the task at hand.
*   If the AI coding assistant consistently generates incorrect code, consider simplifying the task or breaking it down into smaller, more manageable steps.
*   Review the AI coding assistant's configuration and settings to ensure that it is properly configured for the task.
*   Consult the AI coding assistant's documentation or support resources for assistance.
*   If all else fails, consider using a different AI coding assistant or manually writing the code.
*   Do not repeatedly re-submit the same task to the AI coding assistant without making any changes, as this is unlikely to produce a different result.
*   Do not blame the AI coding assistant for generating incorrect code. Remember that it is a tool to assist the developer, and the generated code is the responsibility of the developer.
*   Learn from your mistakes and continuously improve your ability to use AI coding assistants effectively.
*   Do not be afraid to experiment with different approaches to see what works best.
*   Have fun and enjoy the process of using AI coding assistants to build amazing things!

#### 3.5.0. Maintaining Coding Style After Code Generation

*   After the AI Coding Assistant generates code, do not manually reformat or restyle it to match the existing coding style.
*   Instead, configure the AI Coding Assistant to generate code that conforms to the project's coding style from the outset.
*   Use a code formatter like Prettier to automatically format the generated code.
*   Use a linter like ESLint to automatically lint the generated code.
*   Configure the code formatter and linter to use the project's coding style rules.
*   Integrate the code formatter and linter with the AI Coding Assistant to automatically format and lint the generated code.
*   Address all code formatting and linting issues before committing the code.
*   Avoid making manual changes to the generated code unless necessary to fix functional issues.
*   If you must make manual changes to the generated code, follow the project's coding style guidelines.
*   Do not introduce new coding style violations into the codebase.
*   Strive to maintain a consistent coding style throughout the codebase.
*   Use code reviews to enforce coding style consistency.
*   Automate the code formatting and linting process to ensure that all code conforms to the project's coding style.
*   Train developers about the project's coding style guidelines.
*   Perform regular coding style audits to identify and address any inconsistencies.
*   Comply with relevant coding style regulations.

#### 3.5.0. The "AI Prototyper" Role (v2.9.D Series Post-Mortem)
*   As of v2.9.D series, the AI persona is not meant to be a general-purpose code generator. It is a **specialized AI Prototyper designed to resume and resolve a specific failure analysis task.** It is not meant to be used for general feature development or code refactoring.
*   This means the AI is **constrained to the specific context, coding styles, and architectural patterns already established in the v2.9.D series failure analysis codebase**. It should not deviate from these patterns, introduce new components without explicit approval, or attempt to rewrite existing code unless explicitly instructed to do so.
*   The **primary goal is to unblock the critical issue** and get the manual AI analysis buttons working reliably. Secondary tasks that do not directly contribute to this goal are out of scope.
*   The **AI Prototyper is configured and trained specifically for this narrow task.** Its responses are optimized for the specific codebase, problem domain, and coding styles of the v2.9.D series failure analysis effort.

### 3.5.1. UI/UX Conventions
*   Consistent use of ShadCN components from `components/ui`.
*   Use rounded corners, shadows, and drop shadows for a professional feel.
*   Use Tailwind CSS with semantic classes (e.g., `p-4`).
*   Use Tailwind's margin and padding classes for spacing.
*   Update `src/app/globals.css` for theme color changes (primary, background, accent HSL variables).
*   Do **NOT** override Tailwind colors directly in components (e.g., `text-red-200`); rely on theme variables.
*   Use `lucide-react` for icons; verify icon existence. Use inline SVGs if a Lucide icon is not available.
*   Implement offline functionality, responsiveness, accessibility (ARIA attributes), and cross-browser compatibility.

#### 3.5.1.1. Avoiding Hydration Mismatches
*   Defer operations producing different server/client values (`Math.random()`, `new Date()`, `window`, `document`, `localStorage`) to a `useEffect` hook to ensure they run client-side only, after hydration.

### 3.5.2. TypeScript & Data Handling Conventions
*   Use TypeScript with `import type` for type imports.
*   Create isolated, reusable components with default props.
*   Pass image data as data URIs (e.g., `photoDataUri: z.string().describe("...data URI format...")`) and reference in prompts as `{{media url=photoDataUri}}`.
*   Optimize images with `next/image`.
*   Use `https://placehold.co/<width>x<height>.png` for placeholders (e.g., `https://placehold.co/600x400.png`).
*   Add `data-ai-hint` attribute to placeholder images with 1-2 keywords (e.g., `data-ai-hint="stock chart"`).
*   Use Zod schema descriptions in `output.schema` guide the LLM's output format.

### 3.5.3. Server & AI Conventions
*   Default to Next.js App Router.
*   Implement Server Components by default.
*   Leverage Server Actions for form submissions and data mutations.
*   Ensure a single root JSX element per component.
*   Avoid route groups for simple authenticated navigation; use straightforward routing.
*   The application exclusively uses Genkit for GenAI.
*   A global `ai` object (pre-existing in `src/ai/genkit.ts`) **MUST** be used for `ai.definePrompt(...)`, `ai.defineFlow(...)`, etc.
*   **DO NOT** rewrite Genkit initialization code unless specifically requested.
*   Flow files (`src/ai/flows/*.ts`):
    *   Include `'use server';` directive.
    *   Include a JSDoc file overview comment.
    *   Export only the async wrapper function and input/output schema types.
    *   Define one flow per file.
*   Flows use `ai.defineFlow<InputType, OutputType>(...)`.
*   Prompts use `ai.definePrompt({ input: {schema: ZodInputSchema}, output: {schema: ZodOutputSchema}, prompt: "..." })`.
*   Prompt strings **MUST** use Handlebars syntax (e.g., `{{{variable}}}`, `{{#if condition}}...{{/if}}`).
*   **NO** logic, function calls, or `await` within Handlebars templates.
*   Use Gemini 2.0 Flash: `model: 'googleai/gemini-2.5-flash-exp'`.
*   `config: { responseModalities: ['TEXT', 'IMAGE'] }` (MUST provide both).
*   Output is `media.url` (a data URI).
*   Image generation is slow; use separate, parallel flows.
*   Define tools with `ai.defineTool({ name, description, inputSchema, outputSchema }, async (input) => { ... });`.
*   Make tools available to prompts: `ai.definePrompt({ tools: [myTool], system: "..." })`.
*   **Use Tools When:** LLM needs to *decide* to get information or perform an external action.
*   **Do NOT Use Tools When:** Data is *always* needed (pass as prompt input) or for simple transformations (use Handlebars).
*   Configure Gemini safety filters in `generate` calls or `definePrompt` using `config: { safetySettings: [...] }`.
    *   `category`: e.g., `'HARM_CATEGORY_HATE_SPEECH'`
    *   `threshold`: e.g., `'BLOCK_ONLY_HIGH'`

#### 3.5.3.1. Genkit 1.x API Conventions
*   **Initialization:** `const ai = genkit({plugins: [googleAI()]});` (NO `logLevel` option).
*   **Response Access:** `response.text`, `response.output` (NOT `response.text()`, `response.output()`).
*   **Streaming:** `const {stream, response} = ai.generateStream(...);` (NO `await`). Iterate with `for await (const chunk of stream) {}`. Await the `response` promise *after* the stream loop: `await response;`.

### 3.5.4. Code Style - The "Linter's Revenge"
*   **NO COMMENTS IN CODE**, especially `package.json`.
*   Prioritize clean, readable, well-organized, and performant code.
*   Use functional components, hooks, and modern React patterns.
*   Ensure a single root JSX element per component.

### 3.6. Genkit (AI Functionality) Usage Guidelines
*   The application exclusively uses Genkit for GenAI.
*   A global `ai` object (pre-existing in `src/ai/genkit.ts`) **MUST** be used for `ai.definePrompt(...)`, `ai.defineFlow(...)`, etc.
*   **DO NOT** rewrite Genkit initialization code unless specifically requested.

#### 3.6.1. Genkit 1.x API Notes
*   **Initialization:** `const ai = genkit({plugins: [googleAI()]});` (NO `logLevel` option).
*   **Response Access:** `response.text`, `response.output` (NOT `response.text()`, `response.output()`).
*   **Streaming:** `const {stream, response} = ai.generateStream(...);` (NO `await`). Iterate with `for await (const chunk of stream) {}`. Await the `response` promise *after* the stream loop: `await response;`.

#### 3.6.2. Flows, Prompts, and Schemas
*   Genkit Flows wrap LLM calls.
*   Flow files (`src/ai/flows/*.ts`):
    *   Include `'use server';` directive.
    *   Include a JSDoc file overview comment.
    *   Export only the async wrapper function and input/output schema types.
    *   Define one flow per file.
*   Flows use `ai.defineFlow<InputType, OutputType>(...)`.
*   Prompts use `ai.definePrompt({ input: {schema: ZodInputSchema}, output: {schema: ZodOutputSchema}, prompt: "..." })`.
*   Zod schema descriptions in `output.schema` guide the LLM's output format.
*   Pass image data as data URIs (e.g., `photoDataUri: z.string().describe("...data URI format...")`) and reference in prompts as `{{media url=photoDataUri}}`.

#### 3.6.3. Handlebars Templating
*   Prompt strings **MUST** use Handlebars syntax (e.g., `{{{variable}}}`, `{{#if condition}}...{{/if}}`).
*   **NO** logic, function calls, or `await` within Handlebars templates.

#### 3.6.4. Image Generation
*   Use Gemini 2.0 Flash: `model: 'googleai/gemini-2.5-flash-exp'`.
*   `config: { responseModalities: ['TEXT', 'IMAGE'] }` (MUST provide both).
*   Output is `media.url` (a data URI).
*   Image generation is slow; use separate, parallel flows.

#### 3.6.5. Tool Use
*   Tools allow LLMs to request actions/data from the application.
*   Define tools with `ai.defineTool({ name, description, inputSchema, outputSchema }, async (input) => { ... });`.
*   Make tools available to prompts: `ai.definePrompt({ tools: [myTool], system: "..." })`.
*   **Use Tools When:** LLM needs to *decide* to get information or perform an external action.
*   **Do NOT Use Tools When:** Data is *always* needed (pass as prompt input) or for simple transformations (use Handlebars).

#### 3.6.6. Safety Settings
*   Configure Gemini safety filters in `generate` calls or `definePrompt` using `config: { safetySettings: [...] }`.
    *   `category`: e.g., `'HARM_CATEGORY_HATE_SPEECH'`
    *   `threshold`: e.g., `'BLOCK_ONLY_HIGH'`

### 3.7. Error Handling and Robustness
*   Implement proper error handling with `error.js` boundary files at appropriate route segments.
*   Server actions should use `try...catch` and return structured error states.
*   AI flows should include `try...catch` around prompt calls and return well-formed error/default outputs.
*   Client-side components should gracefully handle error states from data contexts.

### 3.8. Debugging and Logging
*   Utilize the client-side debug console (`src/components/debug-console.tsx`) and `StockAnalysisContext`'s `logDebug` function.
*   Server-side logs (`console.log`, `console.error`) are visible in the Next.js development server console.
*   Genkit flows should log entry, inputs, prompt execution details, outputs, and errors.
*   Server actions should log entry, payload validation, flow calls, and errors.
*   Follow the logging conventions established in `src/lib/debug-log-types.ts`.

### 3.9. Commit & Changelog Procedures
*   Increment app version in `src/components/layout/header.tsx`.
*   Update `CHANGELOG.md` with a detailed commit message for each significant change or bug fix series, following the established format.
*   Update this `README.md` if PRD, architecture, or core AI operational rules change.

---

## 4. Project Setup & Running Locally

### 4.1. Prerequisites
*   Node.js (version specified in project, typically latest LTS)
*   npm or yarn

### 4.2. Environment Variables
Create a `.env` file in the project root with the following:
```env
POLYGON_API_KEY=your_polygon_api_key_here
GOOGLE_API_KEY=your_google_ai_api_key_here 
# (Note: GOOGLE_API_KEY is used by Genkit's GoogleAI plugin)
```
Replace `your_polygon_api_key_here` and `your_google_ai_api_key_here` with your actual API keys.

### 4.3. Installation
Install project dependencies:
```bash
npm install
# or
yarn install
```

### 4.4. Running the Development Server
To run the Next.js development server (for UI) and the Genkit development server (for AI flows) concurrently:

1.  **Terminal 1 (Next.js App):**
    ```bash
    npm run dev
    ```
    The application will typically be available at `http://localhost:9002`.

2.  **Terminal 2 (Genkit Flows):**
    ```bash
    npm run genkit:dev
    # or for auto-reloading on changes:
    npm run genkit:watch
    ```
    The Genkit development environment usually starts on `http://localhost:3400`.

### 4.5. Building for Production
```bash
npm run build
npm run start
```

---

## 5. Change History & Versioning
Detailed change history is maintained in `CHANGELOG.md`. The application version is displayed in the header.

---
