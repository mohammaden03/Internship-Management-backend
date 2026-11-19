import { Logger } from '@nestjs/common';

const logger = new Logger('Telemetry');

/**
 * Optional Sentry / OpenTelemetry initialization gated strictly behind env flags.
 * Zero runtime overhead when SENTRY_DSN and OTEL_EXPORTER_OTLP_ENDPOINT are unset.
 */
export function initOptionalTelemetry(): void {
  const sentryDsn = process.env.SENTRY_DSN?.trim();
  const otelEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim();

  if (sentryDsn) {
    try {
      // Optional dependency loaded only when configured
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Sentry = require('@sentry/node');
      Sentry.init({
        dsn: sentryDsn,
        environment: process.env.NODE_ENV || 'development',
      });
      logger.log('Sentry error reporting initialized');
    } catch {
      logger.warn(
        'SENTRY_DSN is set, but @sentry/node is not installed. Install @sentry/node to activate Sentry reporting.',
      );
    }
  }

  if (otelEndpoint) {
    logger.log(
      `OTEL_EXPORTER_OTLP_ENDPOINT detected (${otelEndpoint}); attach @opentelemetry/sdk-node via NODE_OPTIONS=--require to export traces.`,
    );
  }
}
