# Product Requirements Document (PRD)
## Project: Predictive Text Chat Bar (Local Dashboard)

### 1. Overview
A self-hosted dashboard with a centralized chat-bar interface (similar in feel to ChatGPT's input bar) that offers **Gboard-style predictive text / autocomplete** as the user types — instead of routing to an LLM for full responses. The goal is a lightweight, local, next-word/phrase suggestion engine wrapped in a clean chat-style UI.

### 2. Goals & Objectives
- Build a working predictive-text experience (not full LLM chat) running entirely on local infra.
- Present it inside a dashboard with a familiar, centralized chat-input UX.
- Keep the core engine simple (n-gram/Markov based) so it's explainable, fast, and cheap to run.
- Make it extensible later (swap in a small local LLM, add personalization, etc.)

### 3. Target User
- Primary: the builder (self-hosted infra hobbyist) — wants a personal tool/demo running on their own server alongside other self-hosted apps.
- Secondary (future): anyone wanting a private, offline predictive-typing assistant.

### 4. Problem Statement
Predictive typing (Gboard, iOS keyboard) is normally tied to a mobile OS keyboard and isn't available as a standalone, self-hosted, customizable tool. There's no simple local dashboard where you type in a chat bar and get live next-word suggestions you can click to autocomplete.

### 5. Features & Scope

**MVP (buildable in ~1 hour):**
- Centralized chat-bar input (single text box, dashboard-centered, like ChatGPT's).
- As the user types, show up to 3 next-word suggestion chips below/above the bar.
- Clicking a suggestion appends it to the input text.
- Predictions powered by a local n-gram (bigram/trigram) model trained on a text corpus.
- Runs fully locally — no external API calls.

**Phase 2 (post-MVP):**
- Multiple corpora/profiles (e.g., "casual chat", "technical writing") user can switch between.
- Learn from the user's own typed history to personalize suggestions.
- Keyboard navigation (Tab/arrow keys to pick a suggestion).
- Sentence-level "auto-continue" (predict a few words ahead, like Gboard's phrase suggestions).
- Swap n-gram engine for a small local LLM (e.g., via Ollama) behind the same UI, as an upgrade path.
- Persist chat/typing history in a local DB.

**Out of scope for MVP:**
- User accounts / auth.
- Cloud hosting or multi-user sync.
- Full conversational LLM responses (this is autocomplete, not Q&A).

### 6. User Flow
1. User opens dashboard, sees a centered chat bar (empty state, placeholder text).
2. User starts typing a sentence.
3. After each word/keystroke pause, 1–3 suggestion chips appear.
4. User either keeps typing or taps/clicks a suggestion to insert it.
5. User can "send" the composed text (MVP: just clears/logs it — no AI reply needed).

### 7. Success Metrics (MVP)
- Suggestions appear within ~100ms of typing pause (feels "live").
- At least 1 relevant suggestion shown for common word pairs in the training corpus.
- End-to-end demo works fully offline/local.

### 8. Timeline
- **Hour 1 (MVP):** n-gram model + basic web chat-bar UI with live suggestions, both running locally.
- **Later sessions:** personalization, phrase-level prediction, optional local-LLM swap.
