import * as React from 'react';

import { Label } from '@/components/ui/label';

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}

/** Labelled form field with an inline validation message. */
function Field({ id, label, error, children }: FieldProps): React.ReactElement {
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5">
        {label}
      </Label>
      {children}
      {error ? <p className="text-destructive mt-1 text-xs">{error}</p> : null}
    </div>
  );
}

/** "or" divider used between credential and social sign-in. */
function AuthDivider(): React.ReactElement {
  return (
    <div className="text-muted-foreground my-6 flex items-center gap-3 text-xs uppercase tracking-wide">
      <span className="bg-border h-px flex-1" />
      or
      <span className="bg-border h-px flex-1" />
    </div>
  );
}

export { AuthDivider, Field };
