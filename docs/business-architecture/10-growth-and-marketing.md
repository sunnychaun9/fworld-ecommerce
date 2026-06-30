# 10 · Growth & Marketing

**Status:** Specification (no implementation).
**Anchors:** BRD §16/§19/§21, PRD §4/§7, TRD §22 (analytics: GA4, Clarity, Search
Console), `013_ANALYTICS.md`.

Growth is a **business function**, not a campaign. For a premium D2C brand the
durable advantage is owned audience + brand + retention economics, not paid
acquisition alone.

## 1. Growth funnel (AARRR)

| Stage | Question | Primary levers | Core KPI |
| --- | --- | --- | --- |
| **Acquisition** | How do people find us? | SEO, content, social, influencer, paid | organic traffic, CAC |
| **Activation** | Do they have a great first experience? | speed, premium UX, email capture | bounce, email-capture rate |
| **Retention** | Do they come back & re-buy? | lifecycle messaging, quality, new drops | repeat-purchase rate, churn |
| **Revenue** | Are they worth more over time? | AOV, cross/upsell, pricing | AOV, CLV |
| **Referral** | Do they bring others? | reviews/UGC, referral (future) | NPS, referral rate |

## 2. Acquisition channels

| Channel | Role for FWorld | Note |
| --- | --- | --- |
| **Organic search (SEO)** | **Primary** durable channel | BRD §21 lists "Better SEO" as a core advantage; SEO is infrastructure (TRD §16) |
| Content / blog | Build topical authority, assist conversion | 012 Blog/CMS |
| Social (Instagram-led) | Brand & product discovery for fashion | Instagram feed is a future homepage surface (`007`) |
| Influencer / creator | High fit for premium men's fashion | future spend |
| Paid (search/social) | Scale once unit economics proven | watch CAC:CLV |
| Referral | Low-CAC growth | future domain (BRD §19) |

## 3. Lifecycle messaging (retention engine)

Consent-respecting email/SMS/push (notifications domain), India DND/SMS rules
honored:

| Lifecycle | Trigger | Goal |
| --- | --- | --- |
| Welcome | Sign-up / first capture | activate, first order |
| Abandoned cart | Cart inactivity | recover ([06](./06-shopping-cart-strategy.md)) |
| Browse/wishlist nudges | Back-in-stock, price drop | convert consideration |
| Post-purchase | Order milestones | trust, reduce WISMO |
| Review request | After delivery | UGC/social proof |
| Replenish / new-drop | Behavior/recency | repeat purchase |
| Win-back | Lapsed customer | reactivate |

## 4. Retention & loyalty (premium D2C economics)

- The **2nd and 3rd order** drive profitability (CAC amortized). Retention KPIs
  (repeat rate, CLV) are first-class (BRD §16, PRD §4).
- **Reviews/UGC** compound trust and SEO.
- **Loyalty, referral, gift cards, wallet, subscriptions** are **future domains**
  (BRD §19, PRD §7) layered onto Customer + Payments — out of V1 scope (BRD §9).

## 5. Conversion-rate optimization (CRO)

- Premium, fast UX is itself CRO (homepage/PDP < 2s; BRD §21 cleaner checkout).
- Systematic experimentation on PDP, cart, checkout; reduce fields/steps.
- Honest urgency & social proof (no dark patterns — trust > tricks).

## 6. Seasonal & campaign calendar (India)

- Festive peaks (Diwali, etc.), **EOSS**, new-season drops, exclusive launches
  (a BRD §8 revenue source) — coordinated with Merchandising ([04](./04-merchandising-strategy.md))
  and Inventory ([09](./09-admin-workflows.md)).

## 7. Measurement (TRD §22 / 013)

- **GA4** (behavioral), **Microsoft Clarity** (qualitative/heatmaps), **Search
  Console** (SEO). Funnels and cohorts to attribute growth.
- Consent management for analytics/marketing (privacy — BRD §20).

## 8. KPIs

| KPI | Why |
| --- | --- |
| CAC, CLV, CAC:CLV ratio | acquisition sustainability |
| Repeat-purchase rate, churn | retention health |
| AOV, units/order | revenue efficiency |
| Organic traffic & rankings | durable channel strength |
| Email/SMS open, click, opt-out | engagement & list health |
| Abandoned-cart recovery rate | recovered revenue |
| NPS / CSAT, review rate | advocacy & trust |
| ROAS (paid) | paid efficiency (when active) |

## 9. Edge cases & risks

- **Coupon/referral abuse** → limits, validation, fraud flags.
- **Review fraud** (fake/incentivized) → verified-purchase, moderation.
- **Deliverability/compliance** → DND, consent, sender reputation.
- **Discount dependency** eroding premium positioning → margin guardrails.
- **Attribution gaps** (ad-block, cookieless) → first-party + server-side signals.

## 10. Future extensibility

- **Loyalty, Referral, Gift Cards, Wallet, Subscriptions** as new domains.
- **Personalization/AI** for recommendations, lifecycle timing, search.
- **Regional languages** to expand tier-2/3 reach (BRD §19).
- **Marketplace / international** as long-horizon growth pivots (out of V1).
