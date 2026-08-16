# GitHub Pages Release Notes

## Target

| Item | Value |
|---|---|
| Repository | `https://github.com/cs627/pr-speak-coach` |
| Public site | `https://cs627.github.io/pr-speak-coach/` |
| Publishing branch | `gh-pages` at repository root |
| Authentication | None; the static site opens in guest mode. |
| Learner data | Browser `localStorage` only. |

## Validation record

GitHub Pages is enabled and configured to use the `gh-pages` branch. The first public check returned the application’s internal 404 page because the client-side router interpreted `/pr-speak-coach/` as a route rather than a deployment base path. The client router was corrected to use Vite’s `BASE_URL`, the static output was rebuilt, and the updated output was pushed to `gh-pages`.

The site must be rechecked at the public URL after GitHub Pages propagates the latest branch commit.

## Publishing boundary

GitHub Pages is configured to deploy directly from the `gh-pages` branch. A repository workflow file was prepared locally, but the connected GitHub token lacks the `workflows` permission required to push workflow files, so the public repository intentionally relies on the branch deployment source rather than claiming automatic GitHub Actions deployment.

Two public browser checks made immediately after successive `gh-pages` updates still rendered the previous application 404 view. The next verification step is to compare the served document with the newest `gh-pages` commit and distinguish GitHub Pages propagation delay from a browser cache.

The current static page was then verified at `https://cs627.github.io/pr-speak-coach/?release=guest-pages`. It loads the guest interface directly with no sign-in prompt, displays browser-provided English voices, and exposes the daily practice flow. The earlier 404 was a cached prior asset; a query-string refresh loaded the current deployment.

Subsequent normal-URL navigation and a hard refresh still rendered the old 404, despite the cache-busted URL loading the new guest interface. This indicates the GitHub Pages deployment source must be explicitly re-saved or rebuilt; it is not resolved solely by browser refresh.
