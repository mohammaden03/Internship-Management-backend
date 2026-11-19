import { Injectable } from '@nestjs/common';

export interface MetricsSnapshot {
  uptimeSeconds: number;
  totalRequests: number;
  statusBuckets: {
    '2xx': number;
    '3xx': number;
    '4xx': number;
    '5xx': number;
  };
  latencyMs: {
    avg: number;
    max: number;
    p95: number;
  };
}

@Injectable()
export class MetricsService {
  private readonly startedAt = Date.now();
  private totalRequests = 0;
  private status2xx = 0;
  private status3xx = 0;
  private status4xx = 0;
  private status5xx = 0;
  private maxLatencyMs = 0;
  private latencySamples: number[] = [];
  private readonly maxSamples = 1000;

  record(statusCode: number, durationMs: number): void {
    this.totalRequests += 1;
    if (statusCode >= 500) {
      this.status5xx += 1;
    } else if (statusCode >= 400) {
      this.status4xx += 1;
    } else if (statusCode >= 300) {
      this.status3xx += 1;
    } else {
      this.status2xx += 1;
    }

    const safeDuration = Math.max(0, durationMs);
    if (safeDuration > this.maxLatencyMs) {
      this.maxLatencyMs = safeDuration;
    }

    this.latencySamples.push(safeDuration);
    if (this.latencySamples.length > this.maxSamples) {
      this.latencySamples.shift();
    }
  }

  getSnapshot(): MetricsSnapshot {
    const count = this.latencySamples.length;
    let avg = 0;
    let p95 = 0;

    if (count > 0) {
      const sum = this.latencySamples.reduce((acc, v) => acc + v, 0);
      avg = Number((sum / count).toFixed(2));
      const sorted = [...this.latencySamples].sort((a, b) => a - b);
      const p95Idx = Math.min(count - 1, Math.floor(count * 0.95));
      p95 = Number(sorted[p95Idx].toFixed(2));
    }

    return {
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      totalRequests: this.totalRequests,
      statusBuckets: {
        '2xx': this.status2xx,
        '3xx': this.status3xx,
        '4xx': this.status4xx,
        '5xx': this.status5xx,
      },
      latencyMs: {
        avg,
        max: Number(this.maxLatencyMs.toFixed(2)),
        p95,
      },
    };
  }
}
