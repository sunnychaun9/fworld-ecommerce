'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authClient } from '@/services/auth';

import { AuthDivider, Field } from './form-field';
import { GoogleButton } from './google-button';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Values {
  name: string;
  email: string;
  password: string;
}

function RegisterForm(): React.ReactElement {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/';
  const redirectQuery = redirect !== '/' ? `?redirect=${encodeURIComponent(redirect)}` : '';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>();

  async function onSubmit(values: Values): Promise<void> {
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });
    if (error) {
      toast.error(error.message ?? 'Could not create your account.');
      return;
    }
    toast.success('Account created');
    router.push(redirect);
    router.refresh();
  }

  return (
    <div>
      <h1 className="font-display text-foreground text-2xl font-medium tracking-tight">
        Create account
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">Join FWorld — it only takes a moment.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
        <Field id="name" label="Name" error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="name"
            {...register('name', {
              required: 'Enter your name',
              minLength: { value: 2, message: 'Enter your name' },
            })}
          />
        </Field>
        <Field id="email" label="Email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email', {
              required: 'Enter a valid email address',
              pattern: { value: EMAIL_PATTERN, message: 'Enter a valid email address' },
            })}
          />
        </Field>
        <Field id="password" label="Password" error={errors.password?.message}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password', {
              required: 'Choose a password',
              minLength: { value: 8, message: 'Password must be at least 8 characters' },
            })}
          />
        </Field>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Create account
        </Button>
      </form>

      <AuthDivider />
      <GoogleButton redirect={redirect} />

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Already have an account?{' '}
        <Link
          href={`/login${redirectQuery}`}
          className="text-foreground underline underline-offset-4"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export { RegisterForm };
