'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Field } from '@/components/auth/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminReturn, useUpdateReturn } from '@/features/admin/use-admin-misc';
import { ApiError } from '@/services/api';
import { formatCurrency, formatDateTime } from '@/lib/format';
import type { ReturnStatus } from '@/types/return';

import { EntityToolbar } from './entity-toolbar';
import { StatusBadge } from './status-badge';

const NEXT: Record<ReturnStatus, ('APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED')[]> = {
  REQUESTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['RECEIVED', 'REJECTED'],
  RECEIVED: ['REFUNDED'],
  REJECTED: [],
  REFUNDED: [],
};

const STEPS: ReturnStatus[] = ['REQUESTED', 'APPROVED', 'RECEIVED', 'REFUNDED'];

function ReturnPanel({ id }: { id: string }): React.ReactElement {
  const { data, isPending, isError } = useAdminReturn(id);
  const update = useUpdateReturn(id);
  const [reason, setReason] = React.useState('');

  if (isPending) return <Skeleton className="h-64 w-full rounded-lg" />;
  if (isError || !data) {
    return (
      <div className="border-border text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
        No return found for that id.
      </div>
    );
  }

  const options = NEXT[data.status];
  const currentStep = STEPS.indexOf(data.status);
  const refundAmount = Number(data.refundAmount);

  function act(status: 'APPROVED' | 'REJECTED' | 'RECEIVED' | 'REFUNDED'): void {
    update.mutate(
      {
        status,
        ...(reason.trim() ? { decisionReason: reason.trim() } : {}),
        ...(status === 'REFUNDED' ? { refundAmount } : {}),
      },
      {
        onSuccess: () => {
          toast.success(`Return ${status.toLowerCase()}`);
          setReason('');
        },
        onError: (e) =>
          toast.error(e instanceof ApiError ? e.message : 'Could not update the return.'),
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-border bg-background rounded-lg border p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-foreground text-sm font-medium">
              Return #{data.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-muted-foreground text-xs">
              Requested {formatDateTime(data.createdAt)}
            </p>
          </div>
          <StatusBadge status={data.status} />
        </div>

        <ol className="mt-5 flex items-center">
          {STEPS.map((step, index) => {
            const done = data.status !== 'REJECTED' && index <= currentStep;
            return (
              <React.Fragment key={step}>
                <li className="flex flex-col items-center gap-1 text-center">
                  <span
                    className={
                      done
                        ? 'bg-foreground text-background flex size-6 items-center justify-center rounded-full text-[10px]'
                        : 'border-border text-muted-foreground flex size-6 items-center justify-center rounded-full border text-[10px]'
                    }
                  >
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    {step.charAt(0) + step.slice(1).toLowerCase()}
                  </span>
                </li>
                {index < STEPS.length - 1 ? (
                  <span
                    className={
                      done
                        ? 'bg-foreground mx-1 mb-5 h-px flex-1'
                        : 'bg-border mx-1 mb-5 h-px flex-1'
                    }
                  />
                ) : null}
              </React.Fragment>
            );
          })}
        </ol>

        <dl className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Refund amount</dt>
            <dd className="font-medium tabular-nums">{formatCurrency(data.refundAmount)}</dd>
          </div>
          <div className="flex justify-between gap-6">
            <dt className="text-muted-foreground shrink-0">Reason</dt>
            <dd className="text-right">{data.reason}</dd>
          </div>
          {data.decisionReason ? (
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground shrink-0">Decision</dt>
              <dd className="text-right">{data.decisionReason}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      {options.length > 0 ? (
        <div className="border-border bg-background rounded-lg border p-5">
          <h2 className="text-foreground mb-3 text-sm font-medium">Take action</h2>
          <Field id="decision-reason" label="Decision note (optional)">
            <Input
              id="decision-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for this decision"
            />
          </Field>
          <div className="mt-3 flex flex-wrap gap-2">
            {options.map((option) => (
              <Button
                key={option}
                variant={option === 'REJECTED' ? 'outline' : 'default'}
                disabled={update.isPending}
                onClick={() => act(option)}
              >
                {option.charAt(0) + option.slice(1).toLowerCase()}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">This return is in a final state.</p>
      )}
    </div>
  );
}

/**
 * Admin returns. The backend has no "list all returns" endpoint (customer list is
 * user-scoped), so returns are looked up by id — the lifecycle actions use the
 * admin-only `PATCH /returns/:id`.
 */
function AdminReturnsView(): React.ReactElement {
  const [input, setInput] = React.useState('');
  const [activeId, setActiveId] = React.useState('');

  return (
    <div>
      <EntityToolbar title="Returns" description="Look up a return by id to review and action it.">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setActiveId(input.trim());
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Return ID"
            aria-label="Return ID"
            className="h-9 w-72"
          />
          <Button type="submit" size="sm" disabled={!input.trim()}>
            Load
          </Button>
        </form>
      </EntityToolbar>

      {activeId ? (
        <ReturnPanel id={activeId} />
      ) : (
        <div className="border-border text-muted-foreground rounded-lg border border-dashed p-10 text-center text-sm">
          Enter a return id to begin. A full returns queue will be available once the backend
          exposes an admin list endpoint.
        </div>
      )}
    </div>
  );
}

export { AdminReturnsView };
