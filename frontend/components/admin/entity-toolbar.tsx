import * as React from 'react';

interface EntityToolbarProps {
  title: string;
  description?: string;
  /** Primary actions (e.g. a "New" button), shown top-right. */
  action?: React.ReactNode;
  /** Secondary row for search/filters, shown below the heading. */
  children?: React.ReactNode;
}

/** Standard admin page header: title + actions, with an optional filter row. */
function EntityToolbar({
  title,
  description,
  action,
  children,
}: EntityToolbarProps): React.ReactElement {
  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-foreground text-xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="text-muted-foreground mt-1 text-sm">{description}</p> : null}
        </div>
        {action ? <div className="flex items-center gap-2">{action}</div> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

export { EntityToolbar };
