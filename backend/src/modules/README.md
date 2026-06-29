# `backend/src/modules/`

Feature modules for the FWorld API. Each module is a self-contained NestJS
bounded context registered in `AppModule` when implemented.

> **Status: placeholder.** Folders and READMEs only — no implementation.

| Module          | Responsibility                                   |
| --------------- | ------------------------------------------------ |
| `auth`          | Authentication & sessions (strategy pending ADR) |
| `users`         | Accounts, profiles, addresses                    |
| `products`      | Product catalog & variants                       |
| `categories`    | Category taxonomy                                |
| `inventory`     | Stock & reservations                             |
| `cart`          | Shopping cart                                    |
| `wishlist`      | Saved items                                      |
| `orders`        | Order lifecycle & fulfillment                    |
| `payments`      | Razorpay payments & webhooks                     |
| `shipping`      | Shiprocket shipments & tracking                  |
| `coupons`       | Discounts & promotions                           |
| `reviews`       | Ratings & reviews                                |
| `search`        | Meilisearch indexing & query                     |
| `notifications` | Email/SMS/push dispatch                          |
| `analytics`     | Server-side analytics                            |
| `admin`         | Back-office operations                           |
| `cms`           | Editorial content (blogs, pages, banners)        |

Per TRD §6, each module contains Controller, Service, Repository, DTO, Entity,
Validation, and Tests once implemented.
