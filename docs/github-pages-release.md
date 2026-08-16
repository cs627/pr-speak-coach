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
