# AI-assisted research process review

## Contents

- Review the workflow, not only the final text
- Calibrate oversight by task risk
- Map AI use across research stages
- Preserve author decision rights
- Record provenance and validation
- Handle disclosure proportionately
- Review agentic and multi-agent workflows
- Protect sensitive inputs

## Review the workflow, not only the final text

Use this guide only when the author asks how AI contributed, whether the workflow is responsible or reproducible, what to disclose, or how to use research agents. A polished final manuscript cannot reveal the full AI workflow.

Separate:

- **output quality:** whether the final text, evidence, analysis, and citations are sound;
- **process integrity:** whether consequential AI actions and human decisions are traceable and appropriately validated;
- **policy compliance:** whether the current governing course, institution, journal, funder, ethics, privacy, or disclosure rule was followed.

Passing one layer does not establish the others.

## Calibrate oversight by task risk

Do not treat spelling correction and method selection as equivalent uses. Increase oversight when the AI action can materially change:

- the research question or conceptual framing;
- participant rights, confidentiality, consent, or data access;
- inclusion or exclusion of evidence;
- methods, code, parameters, transformations, or statistical decisions;
- interpretation, causal inference, legal or clinical conclusions;
- images, quotations, references, or reported findings;
- public, policy, professional, or high-stakes decisions.

Low-risk language assistance still requires an accurate final text, but it may not require the same audit trail as AI-mediated analysis. Use the current governing policy rather than declaring a universal disclosure threshold.

## Map AI use across research stages

### Problem framing and ideation

- Ask whether the author formed an independent problem statement, boundary, or initial alternatives before relying on AI suggestions.
- Test AI-suggested ideas against feasibility, prior literature, disciplinary relevance, and neglected counter-hypotheses.
- Watch for anchoring, familiar framings, and convergence on similar ideas. More fluent or individually attractive ideas do not ensure collective diversity or originality.

### Research design

- Require the author to explain why the design, comparison, sample, measure, source corpus, or interpretive approach answers the question.
- Verify any AI-suggested method against authoritative methodological sources and field practice.
- Do not let a generated protocol conceal consequential choices or uncertainty.

### Data collection, creation, and preparation

- Check authorization, consent, privacy, copyright, licensing, provenance, and retention rules before data are submitted to an AI service.
- Record whether data are observed, simulated, synthetic, augmented, translated, transcribed, labeled, imputed, or transformed with AI.
- Preserve original data and transformations when the method requires reproducibility or audit.

### Analysis, coding, and interpretation

- Record material code, model, package, environment, version, parameter, prompt, and data transformations when relevant.
- Execute and test generated code; do not validate code by reading an explanation alone.
- Compare outputs with known cases, baselines, sensitivity checks, negative cases, or independent expert review appropriate to the method.
- Separate technically successful execution from a valid scientific, historical, legal, or qualitative inference.

### Literature search and synthesis

- Treat AI-recommended works, summaries, citation maps, and screening decisions as leads until the underlying record and relevant content are inspected.
- Make inclusion and exclusion decisions traceable to the question and stated criteria.
- Read the primary or governing source before relying on it for a consequential claim; do not let an AI summary stand in for inaccessible evidence.
- Check whether AI narrowed the search to familiar, highly indexed, English-language, or consensus sources.

### Writing, translation, and visualization

- Preserve the author's research perspective, argument, and section-level key points before or during AI drafting.
- Verify every generated claim, quotation, reference, number, table, image, and caption against its source or data.
- Check whether translation or rewriting changed modality, uncertainty, technical meaning, voice, or disciplinary convention.
- Prefer a reference manager and authoritative metadata over AI-generated or AI-formatted bibliographies; if AI touched references, audit them fully.

### Review, submission, and peer review

- Confirm final human review and sign-off for the content within each author's responsibility.
- Check current venue rules for disclosure, prohibited uses, images, references, confidential manuscripts, and peer review.
- Do not submit confidential peer-review material or unpublished work to a service without authorization and appropriate data protections.

## Preserve author decision rights

For a consequential contribution, ask whether the responsible author can:

1. explain why the task was delegated;
2. reconstruct the important inputs and transformations;
3. identify what was accepted, substantially modified, or rejected;
4. defend the method, source choice, interpretation, and final wording without appealing to the model's authority;
5. locate the evidence used to validate the result;
6. revise or withdraw the claim if validation fails.

Failure on one item is a revision priority, not automatic misconduct. Recommend returning that decision to the author.

## Record provenance and validation

Use a compact record when material:

| Stage and task | Tool/version/date | Input or corpus | AI contribution | Author decision | Validation | Responsible person |
|---|---|---|---|---|---|---|

Do not demand public release of confidential prompts, protected data, unpublished ideas, security-sensitive instructions, or licensed content. A private audit record may be appropriate even when public disclosure is shorter.

Connect final claims to the relevant source or data, analytical action, human decision, and validation evidence. If the chain cannot be reconstructed, narrow the claim or repeat the step under documented conditions.

## Handle disclosure proportionately

First identify the current governing policy. Policies differ across fields, venues, task types, and time.

When disclosure is required or useful, consider:

- tool, model or platform, and version when known;
- date or period of use;
- research stage and specific purpose;
- portions of the work affected;
- consequential inputs, corpus, or source constraints without exposing protected content;
- material human checks, modifications, and validation;
- confirmation of author responsibility.

Do not automatically demand every prompt or full chat history. Full prompts, code, settings, or logs may be needed when AI use forms part of the research method or when a governing rule requires reproducibility. Routine embedded assistance may have a different threshold. Mark the recommendation provisional when the official rule is unavailable.

## Review agentic and multi-agent workflows

For systems that plan, retrieve, execute tools or code, revise steps, or coordinate agents, record:

- the delegated objective and boundaries;
- permitted tools, data, commands, and external actions;
- model, memory, retrieval source, environment, and dependency versions when material;
- decision and approval points;
- logs linking tool calls, intermediate artifacts, evidence identifiers, and final claims;
- validation gates, stop conditions, escalation, abstention, and rollback procedures;
- the human responsible for each consequential transition.

Critic agents, self-reflection, automated scores, or agreement among agents may catch errors but can share models, prompts, sources, and failure modes. Treat them as internal checks, not independent replication or external validation.

## Protect sensitive inputs

Before recommending an AI step, identify whether inputs contain personal data, participant data, confidential manuscripts, peer-review material, proprietary data, copyrighted full text, export-controlled information, or security-sensitive content.

Use only authorized services and the minimum necessary data. Redact or aggregate when appropriate. When authorization or data handling is unclear, stop and route the author to the relevant institutional, ethics, legal, data-protection, or information-security contact.
