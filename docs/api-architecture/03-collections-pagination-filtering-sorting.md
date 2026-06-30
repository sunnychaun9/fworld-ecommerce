# 03 · Collections: Pagination, Filtering, Sorting

**Status:** ✅ CTO Approved / Frozen for MVP (D2). **Cross-refs:** `005_API.md`,
TRD §23 (scale), PRD §9, database-blueprint/05 (indexing).

## 1. Pagination — **RATIFIED (D2): Hybrid**

Deep offsets are slow (`OFFSET 100000` scans+discards) and unstable at FWorld's
scale (100k products, 10k orders/day — TRD §23). The ratified hybrid model:

| Style | Where (authoritative D2 list) | Why |
| --- | --- | --- |
| **Cursor (keyset)** | **products, orders, reviews, notifications, audit logs, search** | stable + O(1) deep paging on UUID v7 / `createdAt` (database-blueprint/05 §7); these are the large/growing/public lists |
| **Offset** | **small lookup tables, admin reference data, static lists** only | bounded, page-numbered datasets where "page 5 of 20" is expected |

> Per D2, even **admin order/product** lists use **cursor** (they grow
> unbounded). Offset is reserved strictly for small/static reference data.

### Cursor request/response

```text
GET /api/v1/products?limit=20&cursor=eyJpZCI6Ii4uLiJ9
```
```json
{ "data": [ /* items */ ],
  "meta": { "cursor": "eyJ...", "hasNext": true, "total": 235 } }
```

- `cursor` is an **opaque, base64** token (encodes the last sort key + id);
  clients must treat it as opaque. `meta.cursor` is the **next** cursor (null when
  `hasNext` is false).
- `limit` default **20**, max **100** (reject larger with `422`).
- `total` is optional for cursor (omit when the count is expensive).
- Cursors leverage UUID v7's time-ordering and indexed sort columns
  (database-blueprint/05).

### Offset request/response (small/static reference data only)

```text
GET /api/v1/settings/shipping-zones?page=1&limit=20
```
```json
{ "data": [ /* items */ ],
  "meta": { "page": 1, "limit": 20, "total": 18, "totalPages": 1, "hasNext": false } }
```

`page` 1-based; `total`/`totalPages` always present for offset (datasets are small).

## 2. Filtering conventions

- **Filters are query params** named after fields/facets:
  `?category=shirts&color=navy&size=M&minPrice=999&maxPrice=2999&fit=slim`.
- **Multi-value** (OR within a facet) via repeated params or comma list:
  `?size=M&size=L` or `?size=M,L`. Pick **one** form per the OpenAPI spec
  (recommend repeated params; comma reserved for simple enums).
- **Range** filters use `min`/`max` prefixes (`minPrice`, `maxPrice`) or
  `field=gte:1000`. Recommend explicit `min`/`max` for readability.
- **Boolean** flags: `?inStock=true&featured=true`.
- **Reserved params** (never treated as filters): `page`, `limit`, `cursor`,
  `sort`, `order`, `q`, `fields`, `include`.
- **In-stock awareness**: catalog/search filters resolve against **inventory**
  (single source of truth, CTO) so size/color facets reflect real availability
  (business-architecture/05).
- **Search** (`q`) on product listing/search is served by **Meilisearch**
  (CTO/TRD §4), not SQL `LIKE` — see [10](./10-modules-and-events.md). Facets/sort
  on search results come from Meilisearch; relational filters from PostgreSQL
  where applicable.
- **Allow-listed filters only**: each endpoint declares which fields are
  filterable (prevents arbitrary/expensive queries and injection). Unknown filter
  params are ignored or rejected per endpoint policy.

## 3. Sorting conventions

- **`?sort=<field>&order=asc|desc`** (matches `005`). Default `order=desc` for
  time-based feeds, `asc` for names.
- **Multi-sort** (optional): `?sort=price,-createdAt` (leading `-` = desc) — adopt
  only if a feature needs it; otherwise single `sort`+`order`.
- **Allow-listed sort fields** per endpoint, each backed by an index
  (database-blueprint/05) — never sort on an unindexed column at scale.
- **Stable sort**: always tie-break on `id` (UUID v7) so pagination is
  deterministic.
- **Storefront sort options** (business-architecture/05): relevance (search
  default, Meilisearch-weighted), newest, price asc/desc, popularity, discount.

## 4. Field selection & expansion (forward-looking)

- **Sparse fields**: `?fields=id,name,price` to trim payloads (performance, TRD
  §15) — optional, adopt where payloads are heavy (PLP).
- **Relations**: `?include=variants,images` to expand related resources — bounded,
  allow-listed, to avoid N+1/over-fetch. Default responses return a sensible,
  documented shape without requiring `include`.

## 5. Consistency rules

- All list endpoints return the **same envelope + `meta.pagination`** shape.
- Empty results return `200` with `data: []` (never `404` for an empty collection).
- Pagination, filter, and sort params are documented per endpoint in OpenAPI
  ([09](./09-api-documentation.md)).
