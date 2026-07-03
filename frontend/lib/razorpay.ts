import type { RazorpayConstructor } from '@/types/razorpay';

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let loader: Promise<RazorpayConstructor> | null = null;

/**
 * Lazily inject the Razorpay Checkout script and resolve with its constructor.
 * The load is memoised, so concurrent callers share a single `<script>` and it
 * is fetched at most once per session.
 */
export function loadRazorpay(): Promise<RazorpayConstructor> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay can only load in the browser'));
  }
  if (window.Razorpay) {
    return Promise.resolve(window.Razorpay);
  }
  if (loader) {
    return loader;
  }

  loader = new Promise<RazorpayConstructor>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;

    const onLoad = (): void => {
      if (window.Razorpay) {
        resolve(window.Razorpay);
      } else {
        loader = null;
        reject(new Error('Razorpay failed to initialise'));
      }
    };
    const onError = (): void => {
      loader = null;
      reject(new Error('Could not load the payment provider'));
    };

    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
    if (!existing) {
      document.body.appendChild(script);
    }
  });

  return loader;
}
