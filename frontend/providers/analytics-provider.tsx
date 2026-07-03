'use client';

import Script from 'next/script';

import { appConfig } from '@/config/app';

/**
 * Loads analytics only when the corresponding IDs are configured — otherwise it
 * renders nothing (no requests, no cost in local/dev). Scripts use
 * `afterInteractive` so they never block first paint.
 */
export function AnalyticsProvider(): React.ReactElement | null {
  const { gaMeasurementId, clarityProjectId } = appConfig.analytics;

  if (!gaMeasurementId && !clarityProjectId) return null;

  return (
    <>
      {gaMeasurementId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaMeasurementId}', { anonymize_ip: true });`}
          </Script>
        </>
      ) : null}

      {clarityProjectId ? (
        <Script id="clarity-init" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${clarityProjectId}");`}
        </Script>
      ) : null}
    </>
  );
}
