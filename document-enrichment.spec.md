# AI Document Enrichment

## Goal

Extend Papra’s existing AI auto-tagging with document-date extraction, custom-property extraction, and document renaming.

These capabilities should work both automatically after text extraction and through an explicit user action. Users should be able to configure and run each capability independently, while Papra shares document analysis where practical.

## Approach and rationale

Introduce a document enrichment pipeline that coordinates the four capabilities:

- Auto-tagging.
- Document-date extraction.
- Custom-property extraction.
- Document renaming.

Keep each capability’s instructions, validation, settings, and application logic separate. By default, combine compatible capabilities into one structured-output LLM request rather than sending the same document content independently for every feature.

This reduces repeated processing and input-token costs, while allowing the model to use a shared interpretation of the document. Separate feature logic keeps the system maintainable and supports targeted manual runs.

Combining requests is an execution strategy, not a requirement. Use separate calls when capabilities require different models or when combined prompts demonstrably reduce quality. A combined inference failure can affect several capabilities, so accuracy and reliability must be evaluated alongside cost.

The overall flow is:

```text
Automatic processing or manual request
    → Select requested and eligible capabilities
    → Analyze existing extracted text
    → Validate proposed results
    → Apply accepted changes safely
```

## Guiding principles

- **Independent controls:** users can configure each capability separately. Disabling automatic processing does not necessarily disable permitted manual execution.
- **Safe updates:** preserve user-entered values by default. Replacement must be explicit, and edits made while a job is running must remain protected.
- **No forced guesses:** missing or ambiguous information can produce no result rather than an invented value. No result must not erase existing data.
- **One execution path:** automatic and manual triggers use the same asynchronous pipeline. Manual requests can select a subset of capabilities without rerunning OCR.
- **Validated application:** treat document content as untrusted input and model output as proposals. Apply accepted results through existing domain operations.
- **Retryable and observable:** expose progress and outcomes, avoid duplicate side effects, and reuse validated results when retrying application rather than unnecessarily repeating paid inference.
- **Consistent access and accounting:** apply permissions, feature availability, and usage limits to both trigger types. Account for actual inference requests, not each capability within a combined request.
- **Incremental compatibility:** preserve existing auto-tagging behavior during migration and introduce new automatic capabilities disabled by default.

## Delivery steps

Each step is intended to be an independently mergeable PR.

### 1. Introduce the enrichment pipeline

Add the shared orchestrator and background task, initially supporting auto-tagging only. Move automatic scheduling to the new pipeline while retaining compatibility with existing settings and queued work.

**Rationale:** validate the architecture using an existing capability before adding new behavior.

### 2. Support manual execution

Add an endpoint that schedules enrichment for selected capabilities, a way to retrieve the outcome, and an initial manual auto-tagging action.

**Rationale:** establish automatic and manual execution as equal entry points early, rather than building separate workflows later.

### 3. Add document-date extraction

Extract the document’s primary date into the existing document-date field. Define its meaning clearly, including how it differs from due dates or other dates in the document. Add configuration and manual execution controls.

**Rationale:** introduce a narrowly scoped extraction capability and validate combined inference with auto-tagging.

### 4. Add custom-property extraction

Allow users to opt individual properties into extraction and describe the expected information. Validate extracted values against property definitions. Start with supported scalar and select types; defer properties requiring user or document entity resolution.

**Rationale:** reuse Papra’s existing property system while keeping extraction constrained by user-defined types and intent.

### 5. Add document renaming

Generate descriptive document names with configurable preferences and safeguards for manually edited names. Support both automatic processing and explicit manual requests.

**Rationale:** build naming on the shared document analysis without introducing another mandatory LLM call.

### Optional follow-up: naming templates

Support deterministic names built from accepted metadata, such as document date, supplier, and invoice number.

**Rationale:** predictable naming conventions should be rendered in code rather than delegated to an LLM.

## Validation and success criteria

Testing accompanies every delivery step. Evaluate combined and separate prompts on representative documents, including smaller self-hosted models.

The work is successful when:

- Existing auto-tagging continues working through the new pipeline.
- All four capabilities can run automatically or individually on demand.
- Compatible capabilities share inference without an unacceptable loss of quality.
- User edits remain protected and retries do not create duplicate changes.
- Users can understand execution outcomes, and AI usage reflects actual requests.

A generic plugin framework, OCR redesign, and entity-resolution-based property extraction are outside the initial scope.
