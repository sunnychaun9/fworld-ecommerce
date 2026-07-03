import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import * as React from 'react';

import { ProductForm } from '@/components/admin/product-form';
import { ROUTES } from '@/constants/routes';

export default function NewProductPage(): React.ReactElement {
  return (
    <div>
      <Link
        href={ROUTES.adminProducts}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        <ArrowLeft className="size-4" />
        Products
      </Link>
      <h1 className="text-foreground mb-6 mt-3 text-xl font-semibold tracking-tight">
        New product
      </h1>
      <ProductForm />
    </div>
  );
}
