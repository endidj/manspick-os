# Chart.js source runtime

The original https://www.manspick.co.kr/ loads `https://cdn.jsdelivr.net/npm/chart.js`.
On 2026-11-16 that response identified itself as **Chart.js 4.6.1**. This local,
version-pinned copy preserves the existing site's radar layout, curve rendering,
600 ms animation, legend controls and tooltips without a runtime CDN dependency.

- Artifact: https://cdn.jsdelivr.net/npm/chart.js@4.6.1/dist/chart.umd.min.js
- SHA-256: `87364cc2b2a76a6684929e7d6b80b18a897794db38400caff1fcf1791c6925d2`
- License: [MIT](LICENSE.md), preserved from https://raw.githubusercontent.com/chartjs/Chart.js/v4.6.1/LICENSE.md
- Official integration: https://www.chartjs.org/docs/latest/getting-started/integration.html

`source-radar.ts` loads this same-origin script when the radar approaches the
viewport. The React runtime destroys each chart on unmount. The vendor file is
preserved byte-for-byte; do not format it or treat it as application source.
