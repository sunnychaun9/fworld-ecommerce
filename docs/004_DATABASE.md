# Database Design Document

Project: FWorld

Database: PostgreSQL

ORM: Prisma

Version: 1.0

---

# Database Principles

- UUID Primary Keys
- Soft Delete Support
- Audit Fields
- Indexed Search
- ACID Transactions
- Normalized Schema
- Future Multi-Warehouse Support

---

# Common Columns

Every table contains:

id UUID PRIMARY KEY

createdAt TIMESTAMP

updatedAt TIMESTAMP

deletedAt TIMESTAMP NULL

createdBy UUID NULL

updatedBy UUID NULL

---

# Tables

## Users

id

name

email

phone

password

avatar

provider

role

status

lastLogin

emailVerified

phoneVerified

---

## Addresses

id

userId

name

phone

address1

address2

city

state

country

postalCode

isDefault

---

## Categories

id

name

slug

description

image

parentCategory

sortOrder

status

seoTitle

seoDescription

---

## Brands

id

name

slug

logo

description

status

---

## Products

id

categoryId

brandId

name

slug

sku

description

shortDescription

price

salePrice

costPrice

taxRate

weight

status

featured

newArrival

bestSeller

seoTitle

seoDescription

---

## Product Images

id

productId

url

altText

sortOrder

---

## Product Variants

id

productId

size

color

sku

stock

barcode

price

---

## Inventory

id

productVariantId

availableStock

reservedStock

lowStockAlert

warehouseId

---

## Coupons

id

code

discountType

discountValue

minimumOrder

maximumDiscount

usageLimit

validFrom

validTo

status

---

## Cart

id

userId

---

## Cart Items

id

cartId

productVariantId

quantity

price

---

## Wishlist

id

userId

productId

---

## Orders

id

orderNumber

userId

subtotal

discount

shippingCharge

tax

grandTotal

paymentStatus

orderStatus

shippingStatus

paymentMethod

invoiceNumber

---

## Order Items

id

orderId

productVariantId

quantity

price

tax

discount

---

## Payments

id

orderId

gateway

transactionId

status

amount

response

---

## Reviews

id

userId

productId

rating

title

review

status

---

## Blogs

id

title

slug

content

thumbnail

author

publishedAt

seoTitle

seoDescription

---

## Notifications

id

userId

title

message

type

read

---

## Settings

id

key

value

group

---

# Relationships

User → Orders

User → Wishlist

User → Cart

User → Reviews

Category → Products

Brand → Products

Product → Images

Product → Variants

Variant → Inventory

Order → Order Items

Order → Payment

Product → Reviews

---

# Indexes

Email

Phone

Slug

SKU

Product Name

Category

Brand

Order Number

Coupon Code

---

# Soft Delete

Every table except logs uses deletedAt.

---

# Migration Rules

Never modify migrations.

Always create new migration.

---

# Backup

Daily Backup

30 Day Retention

Weekly Full Backup

Monthly Archive

---

# End