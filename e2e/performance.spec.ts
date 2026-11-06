import { expect, test } from '@playwright/test';

const KB = 1024;
/**
 * Budgets per page on a throttled mobile profile, about 20% above what was
 * measured (decided on #19). Bytes are as transferred, gzipped like GitHub
 * Pages serves them. Raise a budget in the same pull request that needs it.
 */
const BUDGETS = [
  {
    name: 'flow',
    path: '',
    total: 1400 * KB,
    Script: 30 * KB,
    Stylesheet: 10 * KB,
    Font: 1200 * KB,
    requests: 22,
    lcp: 2500
  },
  {
    name: 'playground',
    path: 'playground',
    total: 500 * KB,
    Script: 150 * KB,
    Stylesheet: 10 * KB,
    Font: 350 * KB,
    requests: 15,
    lcp: 4000
  },
  {
    name: '404',
    path: 'no/such/page',
    total: 20 * KB,
    Script: 0,
    Stylesheet: 5 * KB,
    Font: 0,
    requests: 6,
    lcp: 2500
  }
] as const;

// A mid-range phone on Slow 4G, like Lighthouse's mobile profile
test.use({
  viewport: { width: 412, height: 823 },
  deviceScaleFactor: 1.75,
  isMobile: true,
  hasTouch: true
});

for (const budget of BUDGETS) {
  test(`${budget.name}: within its budget on a throttled phone`, async ({
    page,
    context
  }) => {
    const cdp = await context.newCDPSession(page);
    const types = new Map<string, string>();
    const bytes: Record<string, number> = {};

    let requests = 0;

    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    cdp.on('Network.responseReceived', (event) =>
      types.set(event.requestId, event.type)
    );
    cdp.on('Network.loadingFinished', (event) => {
      const type = types.get(event.requestId) ?? 'Other';

      requests += 1;
      bytes[type] = (bytes[type] ?? 0) + event.encodedDataLength;
    });
    await page.addInitScript(() => {
      (window as unknown as { lcp: number }).lcp = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          (window as unknown as { lcp: number }).lcp = entry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });

    await page.goto(budget.path);
    await page.waitForLoadState('networkidle');

    const lcp = await page.evaluate(
      () => (window as unknown as { lcp: number }).lcp
    );
    const total = Object.values(bytes).reduce((sum, value) => sum + value, 0);
    const kb = (value = 0) => `${Math.round(value / KB)} kB`;

    // In the log, also when within budget
    console.log(
      `${budget.name}: ${kb(total)} in ${requests} requests (script ${kb(bytes.Script)}, CSS ${kb(bytes.Stylesheet)}, fonts ${kb(bytes.Font)}), LCP ${Math.round(lcp)} ms`
    );

    expect.soft(total, 'total bytes').toBeLessThanOrEqual(budget.total);
    expect
      .soft(bytes.Script ?? 0, 'script bytes')
      .toBeLessThanOrEqual(budget.Script);
    expect
      .soft(bytes.Stylesheet ?? 0, 'CSS bytes')
      .toBeLessThanOrEqual(budget.Stylesheet);
    expect.soft(bytes.Font ?? 0, 'font bytes').toBeLessThanOrEqual(budget.Font);
    expect.soft(requests, 'requests').toBeLessThanOrEqual(budget.requests);
    expect
      .soft(lcp, 'Largest Contentful Paint, ms')
      .toBeLessThanOrEqual(budget.lcp);
  });
}
