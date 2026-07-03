'use client';

import { Star } from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';

import { Rating } from '@/components/common/rating';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDeleteReview, useUpdateReview } from '@/features/reviews/use-reviews';
import { ApiError } from '@/services/api';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { MyReview } from '@/types/review';

function StarInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}): React.ReactElement {
  return (
    <div role="radiogroup" aria-label="Rating" className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === value}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          onClick={() => onChange(n)}
          className="focus-visible:ring-ring rounded-sm p-0.5 outline-none focus-visible:ring-2"
        >
          <Star
            className={cn('size-5', n <= value ? 'fill-brand text-brand' : 'text-muted-foreground')}
          />
        </button>
      ))}
    </div>
  );
}

/** A single review with inline edit and delete. */
function ReviewCard({ review }: { review: MyReview }): React.ReactElement {
  const update = useUpdateReview();
  const remove = useDeleteReview();
  const [editing, setEditing] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [rating, setRating] = React.useState(review.rating);
  const [title, setTitle] = React.useState(review.title ?? '');
  const [comment, setComment] = React.useState(review.comment ?? '');

  function startEdit(): void {
    setRating(review.rating);
    setTitle(review.title ?? '');
    setComment(review.comment ?? '');
    setEditing(true);
  }

  function save(): void {
    update.mutate(
      { id: review.id, input: { rating, title: title.trim(), comment: comment.trim() } },
      {
        onSuccess: () => {
          toast.success('Review updated');
          setEditing(false);
        },
        onError: (error) =>
          toast.error(error instanceof ApiError ? error.message : 'Could not update the review.'),
      },
    );
  }

  function onDelete(): void {
    remove.mutate(review.id, {
      onSuccess: () => {
        toast.success('Review deleted');
        setConfirmOpen(false);
      },
      onError: (error) =>
        toast.error(error instanceof ApiError ? error.message : 'Could not delete the review.'),
    });
  }

  return (
    <div className="border-border rounded-lg border p-4 sm:p-5">
      {editing ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Rating</Label>
            <StarInput value={rating} onChange={setRating} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`title-${review.id}`}>Title</Label>
            <Input
              id={`title-${review.id}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
              placeholder="Summarise your review"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`comment-${review.id}`}>Review</Label>
            <Textarea
              id={`comment-${review.id}`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={2000}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={save} disabled={update.isPending}>
              {update.isPending ? 'Saving…' : 'Save changes'}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)} disabled={update.isPending}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-4">
            <Rating value={review.rating} />
            <span className="text-muted-foreground text-xs">{formatDate(review.updatedAt)}</span>
          </div>
          {review.title ? (
            <p className="text-foreground mt-3 text-sm font-medium">{review.title}</p>
          ) : null}
          {review.comment ? (
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{review.comment}</p>
          ) : null}
          <div className="text-muted-foreground mt-4 flex items-center gap-4 text-xs">
            <button
              type="button"
              onClick={startEdit}
              className="hover:text-foreground transition-colors"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="hover:text-destructive transition-colors"
            >
              Delete
            </button>
          </div>
        </>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this review?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={remove.isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={remove.isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { ReviewCard };
