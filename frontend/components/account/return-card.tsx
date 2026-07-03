import * as React from 'react';

import { formatCurrency, formatDate } from '@/lib/format';
import type { ReturnRequest } from '@/types/return';

import { ReturnStatusBadge } from './status';

/** Summary of a single return request. */
function ReturnCard({ returnRequest }: { returnRequest: ReturnRequest }): React.ReactElement {
  return (
    <div className="border-border rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-foreground text-sm font-medium">
            Return #{returnRequest.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Requested {formatDate(returnRequest.createdAt)}
          </p>
        </div>
        <ReturnStatusBadge status={returnRequest.status} />
      </div>

      <p className="text-muted-foreground mt-3 text-sm">{returnRequest.reason}</p>

      <div className="text-muted-foreground mt-3 flex items-center justify-between text-sm">
        <span>Refund amount</span>
        <span className="text-foreground font-medium tabular-nums">
          {formatCurrency(returnRequest.refundAmount)}
        </span>
      </div>

      {returnRequest.decisionReason ? (
        <p className="border-border text-muted-foreground mt-3 border-t pt-3 text-xs">
          {returnRequest.decisionReason}
        </p>
      ) : null}
    </div>
  );
}

export { ReturnCard };
