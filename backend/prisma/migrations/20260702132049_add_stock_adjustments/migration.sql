-- CreateTable
CREATE TABLE "stock_adjustments" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "reason" VARCHAR(255) NOT NULL,
    "previous_quantity" INTEGER NOT NULL,
    "new_quantity" INTEGER NOT NULL,
    "adjusted_by" UUID NOT NULL,
    "adjusted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_adjustments_variant_id_idx" ON "stock_adjustments"("variant_id");

-- AddForeignKey
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
