<!--
  THIS IS THE ONE FILE YOU EDIT to get your own personalized plan.
  Replace everything below with your own profile, then re-run the pipeline
  (see SETUP.md). The scoring workflow reads this file verbatim as the rubric
  for "who is this person and what makes a talk great for them."
  Keep the section headings — the scorer relies on them. Define up to 6
  priority tracks under "Tracks" and keep the letters A–F (their meaning is
  yours to set; mirror the names/colors in tracks.json).
-->

# Conference-goer profile — Sean Yalda

## Snapshot
Senior software engineer (~15yr pro, 20+ building), self-taught, product-minded, now operating at the **AI agent infrastructure** layer. Repositioning as "Agent Systems & Web Infrastructure." Operates at the ARCHITECTURE / DECISION layer, not the tutorial layer. Learns from production war-stories, post-mortems, tradeoff analyses, "here's what broke and why." Gets NOTHING from hype keynotes or 101 content. Assume an advanced audience.

## Strong-match signals (what makes a talk great)
- Turning human feedback (approve/reject/edit) into training signal; closing the loop; data flywheels; corrections-as-data; provenance/audit substrates; prod traces → fine-tuning-ingestible shape.
- Enforcing correctness STRUCTURALLY: type systems, lint, hooks, guardrails, schema-enforced provenance, invariants that live where they can't be ignored — over prompts/process.
- Owning the stack vs buying a framework: build-vs-buy tradeoffs, lock-in, model-layer-as-moat.
- Evaluating / observing NON-DETERMINISTIC systems in production (methodology, not tooling intros).
- Reversibility, recoverability, audit, trust boundaries, blast-radius in agent systems.
- Multi-agent orchestration at scale: orchestrator-vs-peer, handoffs, failure recovery, harness design.
- Agent security: prompt injection, sandboxing, capability scoping, supply-chain.
- Agent memory beyond basic RAG (Letta/MemGPT lineage, sharded/holographic memory).
- Generative UI / agent-native interaction (provenance-enforced, human-in-the-loop approval/rejection).
- Graph + agents (graph RAG, knowledge graphs for investigative/analytic work).
- Fine-tuning/RL from feedback as SYSTEMS (DPO/SFT, reward modeling, preference data) — the systems that feed/close the loop, not training-math internals.

Tech keywords: TypeScript/Node, Python; LangGraph/LangGraph.js, MCP, A2A, Deep Agents; OpenTelemetry, Langfuse, DeepEval, promptfoo; Cassandra/Elasticsearch/BigQuery/Memgraph; React/Next/Astro, assistant-ui/AG-UI, OKLCH tokens; K8s/GKE/Argo CD, ephemeral preview envs, CI eval gates; Socket/Semgrep/TDD; Ory Kratos/Oathkeeper.

## Negative list (already knows cold — score novelty 0 and depth low)
"What is an LLM", prompt-engineering 101, "intro to agents", getting-started-with-LangChain / framework hello-worlds, basic RAG tutorials, intro React / web-dev fundamentals, basic CI/CD or "intro to Kubernetes", hype keynotes ("AI changes everything") with no technical substance or numbers.

## Creative / maker side (drives creativeAppeal only, NOT technical score)
Broad creative background — graphic design/illustration, photography, typography, music (former touring musician), writing, comedy/newsletter (HYWN brand), woodworking. A genuinely novel generative-media, AI-design-engineering, design-systems, or creative-tooling talk has high creativeAppeal even if its technical-depth fit is moderate.

## Goals for this conference
1. Sharpen the craft of agent eval + feedback loops + orchestration (most slots).
2. Scout what's next in agent infra to inform architecture bets (some slots).
3. Support repositioning toward agent-systems/infra: vocabulary, leading thinkers, peer connections (a couple).
4. Lighter: AI product strategy and DevRel/open-source (maybe one).

## Tracks (priority areas — map each talk to the best-fit letter, or "none")
- **A** = Eval, observability & the feedback/training loop (HIGHEST priority)
- **B** = Multi-agent orchestration & harness architecture
- **C** = Agent security & trust boundaries
- **D** = Agent memory & generative UI / agent-native UX
- **E** = AI app platform & prod LLM ops (eval gates in CI, preview envs, staging for non-deterministic, deployment)
- **F** = Stretch / wildcard (RL/fine-tuning frontier, graph+agents, sharp data-driven AI product strategy, OR creative/design-engineering/generative-media)
- **none** = generic "how to build an agent", vendor pitch with no transferable lesson, or off-topic.
