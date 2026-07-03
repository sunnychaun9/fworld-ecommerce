'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Field } from '@/components/auth/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateNotification } from '@/features/admin/use-admin-misc';
import { ApiError } from '@/services/api';
import type { NotificationType } from '@/types/notification';

import { EntityToolbar } from './entity-toolbar';

const TYPES: NotificationType[] = ['ORDER', 'PAYMENT', 'SHIPPING', 'RETURN', 'PROMOTION', 'SYSTEM'];

/** Send a notification to a specific customer (`POST /notifications`). */
function AdminNotificationsView(): React.ReactElement {
  const create = useCreateNotification();
  const [userId, setUserId] = React.useState('');
  const [type, setType] = React.useState<NotificationType>('SYSTEM');
  const [title, setTitle] = React.useState('');
  const [message, setMessage] = React.useState('');

  function submit(): void {
    if (!userId.trim() || !title.trim() || !message.trim()) {
      toast.error('User ID, title and message are required.');
      return;
    }
    create.mutate(
      { userId: userId.trim(), type, title: title.trim(), message: message.trim() },
      {
        onSuccess: () => {
          toast.success('Notification sent');
          setTitle('');
          setMessage('');
        },
        onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not send.'),
      },
    );
  }

  return (
    <div>
      <EntityToolbar title="Notifications" description="Send a notification to a customer." />
      <div className="border-border bg-background max-w-xl space-y-4 rounded-lg border p-5">
        <Field id="notif-user" label="Customer user ID">
          <Input
            id="notif-user"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="UUID"
          />
        </Field>
        <div className="space-y-1.5">
          <Label htmlFor="notif-type">Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as NotificationType)}>
            <SelectTrigger id="notif-type" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Field id="notif-title" label="Title">
          <Input id="notif-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field id="notif-message" label="Message">
          <Textarea
            id="notif-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </Field>
        <Button onClick={submit} disabled={create.isPending}>
          {create.isPending ? 'Sending…' : 'Send notification'}
        </Button>
      </div>
    </div>
  );
}

export { AdminNotificationsView };
