---
name: asd-ste100-writing
description: Use ASD-STE100 Issue 9 for clear technical documents and English responses.
when_to_use: Use when writing or editing internal technical documents, SOPs, runbooks, technical explanations, or English response text with ASD-STE100 Simplified Technical English and clear response formatting.
version: 1.0
update_date: 2026-11-09
do_not_use_when:
  - The task only changes executable code, commands, identifiers, or data without prose.
  - The task requires an exact quotation, transcription, or translation with no style changes.
  - The task is creative writing, dialogue, or marketing copy with a specified voice.
alwaysApply: false
---

# SOP: ASD-STE100 Technical Writing

## 1. Purpose

Use ASD-STE100 Issue 9 to make technical writing clear and precise. Keep the meaning correct when you simplify the language.

Use the writing rules and dictionary together. A short sentence is not sufficient evidence of STE compliance.

## 2. Scope

Apply this SOP to internal technical documents and technical responses. This includes specifications, design notes, reports, procedures, SOPs, and runbooks.

| Content | Application |
| --- | --- |
| English instructions | Apply the general rules and section 5 for procedural writing. |
| English descriptions and explanations | Apply the general rules and section 6 for descriptive writing. |
| English responses with instructions and explanations | Select the applicable rules for each part of the response. |
| Prose in other languages | Use clear actions, consistent terms, and short sentences. Do not apply the English dictionary or claim STE compliance. |
| Code, commands, identifiers, paths, logs, and direct quotations | Keep their exact content. Apply this SOP to the prose around them. |

This SOP does not select the response language. Follow the user's language request and the governing instructions.

## 3. How to Use This SOP

1. Identify the reader, the required information, and the requested format.
2. Identify instructions and descriptive text separately. Identify technical terms that must stay unchanged.
3. Read the applicable sections of the [writing rules](../references/asd-ste100/writing-rules.md). Use the section map below.
4. Check word use in the [dictionary](../references/asd-ste100/dictionary.json). Read the complete matching entries, including restrictions and examples.
5. Write the content. Keep the facts, conditions, and action sequence correct.
6. Check the result with the completion criteria in section 6.

Load only the reference sections and dictionary entries that the current work needs. Do not put the full dictionary into every conversation.

### Reference section map

| Need | Writing rules |
| --- | --- |
| Word choice, parts of speech, meanings, technical nouns, and technical verbs | Section 1 |
| Multi-word nouns | Section 2 |
| Verb forms, tenses, and voice | Section 3 |
| Clear sentences and lists | Section 4 |
| Instructions, conditions, and notes | Section 5 |
| Explanations, paragraphs, and information order | Section 6 |
| Safety instructions | Section 7 |
| Punctuation and STE word counts | Section 8 |
| Rewriting and consistent terminology | Section 9 |

## 4. Rules

### Preserve the meaning

- Keep names, values, units, conditions, exceptions, and action order correct.
- Keep the difference between an action and a check of its result. "Disconnect the power supply" and "Make sure that the power supply is disconnected" have different purposes.
- Keep obligation and permission clear. Do not change a requirement into a suggestion.
- Name the person or system that does an action when this information is necessary.
- Distinguish an observed result from an assumption, a proposed action, or an unverified claim.
- Do not remove necessary information to meet a sentence length limit. Divide the text into clear sentences instead.

### Use the dictionary correctly

The dictionary is a JSON array. Each object describes a word or phrase and its permitted or alternative use.

| Field | Use |
| --- | --- |
| `headword` | Find the word or phrase. A case-insensitive search can find both approved and non-approved entries. |
| `part_of_speech` | Select the entry for the intended grammatical use. `null` means the source has no part-of-speech label. |
| `approved` | Check whether this entry is approved. This value does not approve every meaning or grammatical use of the word. |
| `word_and_forms` | Check the listed forms and restrictions. |
| `meaning_or_alternatives` | Read the approved meaning, alternatives, and usage notes in full. |
| `ste_examples` | Examine the permitted use in context. |
| `non_ste_examples` | Compare the original use that needs a change. An empty field is not a missing instruction. |

- Parse the array and filter by `headword`, then check the part of speech. Do not treat a match inside an example as a dictionary entry.
- When the text uses an inflected form, find its base entry and check `word_and_forms`.
- Read all entries for a word when the intended part of speech is unclear. Do not select the first search result without checking it.
- Keep the original line breaks when you inspect a field with several meanings or alternatives. Do not treat all its text as one replacement word.
- Select an alternative that keeps the intended meaning. Change the sentence construction when a direct replacement does not work.
- For technical nouns and technical verbs, check the categories in rules 1.5–1.13 and the applicable project glossary. A missing dictionary entry is not automatic permission or an automatic prohibition.
- Use one term for one concept. Do not replace a term with a synonym only to avoid repetition.

### Write instructions and descriptions

- In procedural writing, use the imperative form and a maximum of 20 words per sentence. Give one instruction per sentence, except for simultaneous actions permitted by rule 5.2.
- Put a necessary condition before the instruction. Keep notes informational, as specified in rules 5.4 and 5.5.
- In descriptive writing, use a maximum of 25 words per sentence. Give each paragraph one topic and no more than six sentences.
- Use active voice. In descriptive writing, the passive voice is permitted only when the agent of the action is unknown, as specified in rule 3.6.
- Check permitted verb forms in section 3. Do not invent a general ban on every word ending in "-ing". Apply rule 3.5 and its technical-noun cases.
- Check multi-word nouns under section 2. Do not shorten an official technical name in a way that changes its identity.
- Count words with section 8. A count based only on spaces does not implement all STE counting rules.
- Apply section 7 when the source or task requires safety instructions. Do not invent warnings that the task does not need.

### Organize internal documents

These are local document conventions, not additional ASD-STE100 rules.

- Start with the purpose or result that the reader needs.
- Separate facts, requirements, decisions, and open questions when the distinction affects use.
- Use numbered steps for actions that must occur in sequence.
- Use lists for related items and tables for comparisons. Keep prose as paragraphs when a list adds no value.
- Include evidence and limitations for material technical claims.
- Follow an existing document template when one applies. Do not add unused sections.

### Format responses

These are local response conventions, not ASD-STE100 requirements.

- Answer the question or state the result first. Then give the explanation needed to use or assess it.
- Match the detail to the request. A simple answer does not need a heading or a fixed report template.
- For completed work, state what changed and what was checked. Include material limitations or remaining work.
- Use valid Markdown when the host permits it. Keep a blank line before lists and after headings.
- Use code formatting for exact commands and identifiers.
- 在 Markdown 回复中引用本地文件或目录时，只使用以下链接目标格式：`[标签](file:///完整绝对路径)`。链接目标必须包含完整绝对路径，并使用 `file://` URL。标签内容不受此规则限制，可以使用简短说明或完整路径。
- 不使用普通绝对路径目标、项目相对路径目标或目标尖括号。路径中的空格使用 `%20` 编码；其他需要 URL 编码的字符也必须正确编码，保留路径分隔符 `/`。目录链接遵守同一格式。
- 此约定只约束 Markdown 回复中的本地文件与目录链接；不改写命令、代码、直接引文或文档内部的相对引用。更高优先级指令有冲突时，按第 5 节处理。
- Preserve a requested output schema. Do not add prose around JSON or other output when the user requires only that format.
- Do not announce STE compliance in routine replies. Make such a claim only after checking the applicable rules and word uses against a named issue.

## 5. Conflicts and Exceptions

| Condition | Action |
| --- | --- |
| A higher-priority instruction or an explicit user requirement conflicts with this SOP | Follow that instruction. Do not claim compliance for an exception that was not checked. |
| A format or language requirement differs from these local conventions | Keep the required format or language. Apply the writing guidance where it fits. |
| A simpler sentence changes technical meaning | Keep the meaning and rewrite the structure. Do not accept the change only because it is shorter. |
| The dictionary entry is unclear or the converted reference appears inconsistent | Check the applicable rule and the official source. Do not infer approval from an ambiguous entry. |
| A required reference is unavailable | State the limitation if it affects the result. Continue work that does not depend on the missing reference. |
| The user requests a formal STE compliance assessment | Check every applicable rule and word use. Name the issue and disclose unresolved exceptions. A spelling check or dictionary match alone is insufficient. |

## 6. Completion Criteria

- [ ] The language and format match the request and governing instructions.
- [ ] The applicable procedural or descriptive rules were selected.
- [ ] Names, facts, conditions, obligations, and action order retain their meaning.
- [ ] Word choices use the correct part of speech, meaning, and permitted form.
- [ ] Technical terms follow the applicable categories and project glossary.
- [ ] Sentences, paragraphs, and lists satisfy the applicable writing rules.
- [ ] Code, commands, identifiers, paths, logs, and direct quotations remain exact.
- [ ] Material claims have evidence, and relevant limitations are clear.
- [ ] Markdown 回复中的本地文件与目录链接使用完整绝对路径的 `file://` URL；目标不加尖括号，必要字符已编码，标签内容不受此规则限制。更高优先级指令要求的例外已按第 5 节处理。
- [ ] Any compliance claim names the checked issue and does not exceed the checks performed.

## 7. Sources

- [Writing rules — Issue 9](../references/asd-ste100/writing-rules.md): the nine rule sections and their explanations, examples, and necessary figure.
- [Dictionary — Issue 9](../references/asd-ste100/dictionary.json): 2,198 content-only entries. This count describes extracted records, not a claim about the standard's stated word totals.
- [Source and copyright notice](../references/asd-ste100/NOTICE.md): source identity, conversion limits, and rights notice.
- [Official ASD-STE100 source](https://www.asd-ste100.org/assets/files/ASD-STE100_ISSUE9.pdf): use it to resolve uncertainty in the converted references.

Resolve local reference links relative to this SOP file, not the current working directory. The converted files are reading aids, not a new edition of the standard.
