# AGENTS.md

Instructions for AI coding agents working in this repository.

## Project context

This repo holds code snippets and image assets for the Nachtloipen Cup club website. The website itself is **hosted and rendered by [Clubdesk](https://www.clubdesk.com/)**, a hosted club-management/homepage platform — there is no local build, server, or deployment pipeline in this repo.

- Code here (HTML/CSS/JS snippets) is written to be pasted into Clubdesk's custom-code fields (e.g. custom HTML blocks, header/footer injections, individual page content).
- Images under `Bilder/` and `Helvetialogo/` are source assets uploaded manually through the Clubdesk admin UI.

## Working guidelines

- Do not assume a build system, package manager, or test runner exists — there isn't one. Don't add `package.json`, bundlers, or frameworks unless explicitly requested.
- Keep snippets self-contained and framework-free (plain HTML/CSS/JS), since they run inside Clubdesk's page templates, not a standalone app.
- When adding or editing a snippet, note where in Clubdesk it is meant to be pasted (e.g. in a comment at the top of the file or in the commit message).
- Preserve existing image file names and formats; Clubdesk pages may reference them by name.
- Keep the [README.md](README.md) structure section up to date when adding new top-level folders.

## Loader pattern

`src/header/header.html` and `src/mainpage/mainpage-content.html` are the actual snippet sources. They are **not** pasted into Clubdesk directly anymore — instead `src/header/header-loader.html` / `src/mainpage/mainpage-content-loader.html` (tiny fetch scripts pointing at jsDelivr) are pasted once, and they pull the current file content from this repo's `main` branch at runtime. When editing `header.html` or `mainpage-content.html`, do not rename them or change their mount `id` (`nlc-header-mount` / `nlc-mainpage-mount`) without also updating the corresponding loader file. [.github/workflows/purge-jsdelivr.yml](.github/workflows/purge-jsdelivr.yml) purges the CDN cache on every push to `main` so changes go live quickly.
