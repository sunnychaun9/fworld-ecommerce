-- AlterTable
ALTER TABLE "products" ADD COLUMN     "best_seller" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fabric" VARCHAR(64),
ADD COLUMN     "fit" VARCHAR(32),
ADD COLUMN     "neck_type" VARCHAR(32),
ADD COLUMN     "new_arrival" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "occasion" VARCHAR(32),
ADD COLUMN     "pattern" VARCHAR(32),
ADD COLUMN     "seo_description" VARCHAR(320),
ADD COLUMN     "seo_title" VARCHAR(180),
ADD COLUMN     "sleeve_length" VARCHAR(32);
