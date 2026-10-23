# Source verification protocol

## Contents

- Keep three questions separate
- Build the inventory
- Route by source type
- Search sequence
- Detect metadata and chimeric problems
- Evidence levels for claim support
- Source-status labels
- Stop rule for an unresolved source
- Common non-proof warning signs
- Quotation and numerical-claim cautions

## Keep three questions separate

1. **Existence:** A matching work or official record can be found.
2. **Metadata accuracy:** The cited fields match the authoritative record.
3. **Claim support:** Accessible content supports the claim at the stated strength.

A correct DOI does not prove that all metadata are correct. A real paper does not prove that it supports the writer's claim.

## Build the inventory

Record the cited form, location in the document, source type, linked claim, identifiers, and available access. Include formal references, footnotes, hyperlinks, statistics, named reports, laws, cases, books, datasets, software, and organizational claims.

## Route by source type

| Source type | Prefer first | Useful secondary checks |
|---|---|---|
| Journal or conference paper | DOI resolver, publisher, journal or repository record | Crossref, OpenAlex, Semantic Scholar, discipline index |
| Preprint | Named repository and version history | Author page, later published version |
| Book or chapter | Publisher, ISBN agency, library catalog | WorldCat or institutional catalogs, reviews only as leads |
| Thesis | Awarding institution or national thesis system | Institutional repository, library catalog |
| Government or institutional report | Issuing body and stable report number or URL | Library catalog, archived official page |
| Law or court decision | Official legal database or court | Trusted legal database; never rely on news alone |
| Dataset or statistics | Data producer, dataset/version page, release table | DOI registry, catalog record, archived release |
| News or web source | Original publisher and dated page | Web archive, syndicated copies, cited primary document |

## Search sequence

1. Resolve the supplied DOI, ISBN, PMID, arXiv ID, report number, accession number, or stable URL.
2. Compare title and creator fields on the original publisher, repository, issuing body, or catalog.
3. Search exact title in quotation marks.
4. Search first author plus distinctive title words.
5. Search title variants, punctuation-normalized forms, translated titles, and Traditional/Simplified Chinese variants.
6. Search the journal, publisher, institution, author profile, ORCID, volume/issue contents, or relevant domain database.
7. For local or Chinese sources, follow `taiwan-chinese-sources.md` before stopping.

Record the source names and URLs actually checked. Do not report a connector or database as searched merely because it exists.

## Detect metadata and chimeric problems

Compare:

- title and subtitle;
- all material authors or editors;
- year, online-first date, and print date;
- journal, conference, publisher, or institution;
- volume, issue, pages, article number;
- DOI, ISBN, report or accession number;
- version, edition, retraction, correction, or withdrawal status.

Treat a real title combined with wrong authors, venue, year, or DOI as a possible chimeric or corrupted citation. Report the exact conflicting fields.

Allow legitimate differences such as transliteration, translated titles, journal abbreviations, online-first dates, article numbers instead of pages, and later editions. Explain rather than silently normalize.

## Evidence levels for claim support

- **Full-text confirmed:** The relevant passage, table, method, or result was inspected.
- **Abstract-level indication:** Only the abstract or structured summary was inspected; limit the conclusion accordingly.
- **Metadata only:** Existence and bibliographic fields were checked; make no claim-support judgment.
- **Secondary description only:** Use as a lead and request the original source.
- **Inaccessible:** Give a manual verification step.

Use these claim-support labels:

- Supports the claim
- Partially supports or requires narrower wording
- Does not support the claim
- Contradicts the claim
- Cannot assess from accessible content

## Source-status labels

- **已確認：** An authoritative record matches the essential metadata.
- **部分確認：** A credible record exists, but some fields or versions remain unresolved.
- **資訊不一致：** A record exists and one or more cited fields conflict.
- **尚未核實：** Search or access was insufficient; this is not evidence of fabrication.
- **高度疑似虛構或拼接：** Multiple independent checks reveal affirmative conflicts, such as a wrong DOI target plus contradictory venue, publisher, or author records. Empty search results alone do not qualify. Require human review.

Do not use a numeric confidence score.

## Stop rule for an unresolved source

Before stopping, use at least:

1. identifier resolution when an identifier is supplied;
2. exact-title search;
3. author plus distinctive-title search;
4. one source appropriate to the document type, language, region, or discipline.

If these checks are unavailable, say which were not performed. Provide the exact next query and destination.

## Common non-proof warning signs

Treat these only as reasons to inspect more closely:

- DOI resolves to a different title;
- real authors combined with an untraceable title;
- impossible volume, issue, page, or date;
- generic title with no venue record;
- inconsistent title across reference list and in-text citation;
- quotation or statistic absent from accessible source content;
- source appears only in AI-generated pages or duplicate bibliographies.

Do not treat generic titles, missing DOIs, paywalls, broken URLs, books, grey literature, or non-English publication as proof of fabrication.

## Quotation and numerical-claim cautions

- Do not mark a direct quotation verified unless the original wording and page or stable location were inspected.
- Identify quotations known only through an intermediary as secondary quotations.
- For statistics, trace the claim to the original table, dataset, or release when accessible; check denominator, date, definition, population, unit, and revision status.
- A source can exist and contain the quoted topic while still failing to support the exact wording or number.
- Use `data-quality-and-source-selection.md` for quality, suitability, statistics, selection, and evidence-diversity judgments.
