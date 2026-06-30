# 02 · Customer Journey

**Status:** Specification (no implementation).
**Builds on** BRD §11 / PRD §12 (linear journey) and personas (BRD §7), expanded
into a full **lifecycle** for a long-term premium brand.

## 1. Lifecycle model

A premium D2C brand optimizes the **whole relationship**, not just one purchase:

```text
Awareness → Acquisition → Consideration → Conversion → Fulfillment → Retention → Advocacy
   (SEO,        (first        (PDP, size,     (cart,        (delivery,    (re-order,   (reviews,
   social,      visit,        reviews,        checkout,     tracking,     wishlist,    referral,
   content)     account)      wishlist)       payment)      returns)      lifecycle)   UGC)
```

Advocacy feeds back into Awareness (reviews, referrals, word of mouth).

## 2. Personas (from BRD §7) and primary need

| Persona | Age | Wants | Key friction to remove |
| --- | --- | --- | --- |
| College Student | ~20 | Oversized tees, cargos, jeans | price/quality doubt, fit risk |
| Working Professional | ~28 | Shirts, trousers, polos | time — wants fast shopping & easy returns |
| Fashion Enthusiast | ~24 | New arrivals, premium drops | generic experience — wants premium presentation |

## 3. Stage detail

For each stage: goal, key touchpoints, what builds trust, friction/edge cases,
and KPIs.

### 3.1 Awareness

- **Goal:** be discoverable by intent ("oversized t-shirt for men") and brand.
- **Touchpoints:** organic search (SEO-as-infrastructure), blog/editorial, social,
  influencer, paid (later).
- **Trust:** fast, premium landing pages; social proof.
- **KPIs:** organic traffic, impressions, ranking, new-visitor share.

### 3.2 Acquisition (first visit)

- **Goal:** earn a first session and, ideally, an identity (email/phone) without
  forcing it.
- **Touchpoints:** homepage, category landing, announcement bar, newsletter prompt.
- **Trust:** no aggressive gating; guest browsing fully enabled (PRD Guest role).
- **Edge cases:** ad-blocked analytics; deep-link to PDP from search (must stand
  alone with context + related products).
- **KPIs:** bounce rate, pages/session, email-capture rate.

### 3.3 Consideration

- **Goal:** give enough confidence to add to cart — imagery, fit, reviews.
- **Touchpoints:** PLP (filters/sort), PDP (gallery/zoom, size + size guide,
  reviews, delivery/pincode check, related/recently-viewed), wishlist.
- **Trust:** large premium imagery (`007`), authentic reviews, clear stock and
  delivery ETA.
- **Edge cases:**
  - **Guest wishlist** — behavior undefined across docs (⚠ **C4**): recommended
    pattern is *local wishlist for guests, merged on login*; flagged, not decided.
  - Out-of-stock variant → offer notify-me / alternative sizes.
- **KPIs:** PDP view rate, add-to-cart rate, wishlist adds, size-guide opens.

### 3.4 Conversion

- **Goal:** turn the basket into a paid order with minimal friction.
- **Touchpoints:** cart/mini-cart, checkout, payment, confirmation.
- **Trust:** transparent pricing (price + tax + shipping), visible coupon value,
  secure-payment cues, guest checkout.
- **Edge cases:** payment failure/pending, stock lost at payment, coupon invalid —
  see [07](./07-checkout-architecture.md).
- **KPIs:** cart abandonment, checkout completion, payment success, AOV.

### 3.5 Fulfillment

- **Goal:** deliver reliably and keep the customer informed.
- **Touchpoints:** order confirmation, shipment tracking, delivery, invoice
  (GST), returns if needed.
- **Trust:** proactive status notifications; easy 7-day returns.
- **Edge cases:** failed delivery, RTO (esp. COD), partial issues — see
  [08](./08-order-lifecycle.md).
- **KPIs:** on-time delivery, delivery success, return rate, support contacts/order.

### 3.6 Retention

- **Goal:** drive the second and third purchase (where D2C economics are won).
- **Touchpoints:** post-purchase email/SMS, review request, new-arrival/drop
  alerts, wishlist back-in-stock, win-back.
- **Trust:** consistent quality + service; respectful messaging frequency.
- **Edge cases:** consent/opt-out (India DND/SMS rules); over-messaging fatigue.
- **KPIs:** repeat-purchase rate, time-to-second-order, CLV, churn.

### 3.7 Advocacy

- **Goal:** turn happy customers into a growth channel.
- **Touchpoints:** reviews/ratings (UGC), referral (future), social sharing,
  wishlist sharing (future).
- **KPIs:** review submission rate, NPS, referral rate (future).

## 4. Guest vs Customer paths

| Capability | Guest | Customer |
| --- | --- | --- |
| Browse, search, view reviews | ✅ | ✅ |
| Add to cart | ✅ (local) | ✅ (persisted, cross-device) |
| Wishlist | ⚠ C4 (prompt login / local) | ✅ synced |
| Place order | ❌ → guest checkout captures contact | ✅ |
| Track order / history | ❌ (link/OTP lookup only) | ✅ |
| Review product | ❌ | ✅ (ideally verified-purchase) |

**Cart/identity merge:** on login, a guest's local cart (and recommended:
wishlist) merges into the account — a key cross-device behavior (FR-022).

## 5. Mobile-first considerations (BRD/PRD/007)

- Bottom navigation, sticky Add-to-Cart and sticky checkout, large touch targets,
  swipe galleries.
- OTP/login optimized for mobile; minimal typing at checkout.
- Performance budgets (homepage/PDP < 2s) directly protect each stage's KPI.

## 6. Edge cases across the journey

- Returning **guest** with no account but prior orders → contact/OTP-based lookup.
- **Cross-device** abandonment → resume cart on login + abandoned-cart nudge.
- **Price/stock change** between sessions on a wishlisted/carted item → surface
  transparently, never silently.
- **Festive surge** → graceful degradation, queueing, and honest ETAs.

## 7. Future extensibility

- **Personalization** of each stage (AI recommendations, AI search, outfit
  building) — BRD §19, PRD §7.
- **Loyalty/Referral** layered onto Retention/Advocacy.
- **Regional languages** to widen Awareness/Acquisition in tier-2/3 India.
