# 05 · Search & Discovery

**Status:** Specification (no implementation).
**Anchors:** PRD §11 (Search/Filters/Sorting/Recently Viewed/Recommendations),
`007` Search Page, TRD §4 (Meilisearch).

Discovery is how customers get from intent to product. For fashion, this is a
**core conversion lever**: the faster a shopper finds the right item in the right
size, the higher the conversion.

## 1. Discovery surfaces

| Surface | Use | Primary mechanism |
| --- | --- | --- |
| **Search** | Known intent ("white oversized tee") | Meilisearch query |
| **Browse (PLP)** | Category exploration | Taxonomy + filters |
| **Filters & sort** | Narrowing within results | Facets |
| **Recommendations** | Inspire / cross-sell | Behavioral (future AI) |
| **Recently viewed** | Resume consideration | Session/customer history |
| **Collections** | Curated discovery | Merchandising ([04](./04-merchandising-strategy.md)) |

## 2. Search experience (business requirements)

- **Instant/as-you-type** results (premium, fast — TRD §15).
- **Typo tolerance** and **synonyms** (e.g. "tshirt" = "t-shirt"; "joggers" ~
  "track pants") — essential for Indian English variation.
- **Autocomplete suggestions**, **recent searches**, **trending searches**
  (`007`).
- **Relevance** tuned to business: in-stock first, boost new/bestsellers, respect
  category intent.
- **Zero-result handling:** never a dead end — show suggestions, popular items,
  and a clear search-refinement path (`007` No Results State).

## 3. Filters & sort (fashion-specific)

| Filter | Source |
| --- | --- |
| Category / subcategory | Taxonomy |
| Size | Variant (in-stock awareness) |
| Color | Variant |
| Price range | Price |
| Fit (slim/regular/oversized) | Attribute |
| Fabric/material, occasion, pattern | Attribute |
| Discount / offer | Promotions |
| Rating | Reviews |

| Sort | Note |
| --- | --- |
| Relevance (default for search) | business-weighted |
| New arrivals | recency |
| Price low→high / high→low | value |
| Popularity / bestselling | behavioral |
| Discount | offer-led |

- **In-stock awareness:** filtering by size should reflect *variant-level*
  availability so customers don't reach a dead PDP.

## 4. Index as a derived projection

- The **catalog is the source of truth**; the search index is a **projection**
  kept in sync (catalog/inventory/price changes propagate to the index).
- Sync freshness is a business SLA (e.g. new products and stock changes searchable
  quickly) — the mechanism is an implementation/ADR concern, the **expectation**
  is set here.

## 5. KPIs

| KPI | Signal |
| --- | --- |
| Search conversion rate | search effectiveness |
| Zero-result rate | catalog/synonym gaps |
| Search exit/refinement rate | relevance quality |
| Filter usage & filter→PDP rate | navigability |
| Recommendation CTR / attributed revenue | discovery uplift |
| Time-to-first-result | performance |

## 6. Edge cases

- **Zero results** → suggestions + popular + recent (never blank).
- **Out-of-stock-heavy results** → demote/segregate sold-out; offer notify-me.
- **Ambiguous queries** ("black") → facet prompts to disambiguate.
- **Index lag** after catalog change → bounded staleness; avoid showing
  unpurchasable items as available.
- **Misspellings/transliteration** (Hinglish) → synonyms/typo tolerance.
- **Injection/abuse** in search input → treated as untrusted (handled in
  implementation; flagged as a security expectation).

## 7. Future extensibility

- **AI semantic search** and **natural-language queries** (BRD §19, PRD §7).
- **Visual search** (search by image) — strong fit for fashion.
- **Personalized ranking** by behavior/segment.
- **Voice & regional-language search** for tier-2/3 reach.
