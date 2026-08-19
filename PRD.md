# Product Requirements Document (PRD)
## Project: GhostType (Predictive Text & Smart Writing Assistant)

### 1. Overview
GhostType is a self-hosted, centralized chat-bar interface that offers instantaneous, zero-latency **predictive text / autocomplete** powered by a lightweight local N-gram engine, paired with an **automated grammar correction and tone rewriting** system powered by a local LLM. It acts as an ultra-fast, intelligent scratchpad for drafting text.

### 2. Goals & Objectives
- Provide instantaneous (0.0ms latency) mid-word and next-word predictive text.
- Automatically correct spelling and grammar in the background without user intervention, preserving original casing.
- Offer tone rewriting capabilities (e.g., Formal, Friendly, Informal).
- Support a "Teach" feature to seamlessly inject personal vocabulary and jargon into the prediction engine.
- Run entirely locally with a frictionless, single-command bootstrapping workflow.

### 3. Target User
- Primary: Developers and self-hosting enthusiasts who want a private, lightning-fast smart writing assistant that learns their personal vocabulary.

### 4. Problem Statement
Cloud-based writing assistants (like Grammarly or ChatGPT) are slow, require internet access, and pose privacy risks. Standalone predictive typing is usually restricted to mobile keyboards. There is no simple, local dashboard combining Gboard-style instant autocomplete with LLM-powered automatic grammar correction.

### 5. Features & Scope
**Current Capabilities:**
- **Instant Autocomplete:** A purely local N-gram (unigram, bigram, trigram) engine provides sub-millisecond, mid-word predictions as the user types.
- **Automated Grammar Correction:** Background LLM requests (debounced at 400ms) automatically fix grammatical errors and replace text instantly while strictly respecting original casing.
- **Tone Generator:** Highlight text and click the "Mask" (🎭) icon to rewrite text into different conversational tones using a local LLM.
- **Teach-a-Word Dictionary:** A UI button (`+`) allows bulk or single-word injection into the prediction engine. These personal words are blended with the base corpus and instantly suggested.
- **Dynamic UI:** The chat bar dynamically resizes to fit text using a hidden ghost-layer measurement technique.
- **Zero-Friction Dev Workflow:** `npm run dev` automatically checks Python dependencies, creates virtual environments, downloads corpora, trains models, and launches all servers cleanly.

### 6. User Flow
1. User opens the dashboard (`http://localhost:3000`).
2. User starts typing; GhostType instantly suggests completions directly inline as grey "ghost text".
3. User presses `Tab` to accept the suggestion.
4. If the user makes a typo or grammatical error, pausing for 400ms triggers the background LLM to automatically replace the incorrect text.
5. User highlights text and clicks the "Mask" (🎭) icon to rewrite the sentence in a different tone.
6. User clicks the `+` button to add new domain-specific words so they are suggested in the future.
