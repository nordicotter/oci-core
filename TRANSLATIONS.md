# OCI Core – German / English / Chinese community localization

**Languages:** Deutsch (`de`), English (`en`), 简体中文 (`zh`). The selected language is saved in browser `localStorage`, not in the OCI database. On first load, the interface follows the browser language (German → German, Chinese → Chinese, others → English).

## Coverage

- All **1,428** unique Chinese frontend source strings identified by the source catalog scan have German and English translations in `web/src/i18n/de.json` and `web/src/i18n/en.json`.
- Another **222** unique dynamic text templates (instance names, quantities, errors, usage figures, etc.) are translated using parameterized forms in `web/src/i18n/patterns.json`.
- The language switcher appears on the setup/login page and in the authenticated top bar. Document title and `<html lang>` follow the selected language.
- Regular text nodes and common accessibility attributes (`title`, `placeholder`, `aria-label`, `aria-description`, `alt`) are included, as are menus rendered via Vue `Teleport`.
- Instance IDs, form values, key material, console commands, and marked user-provided values are excluded from translation.

**Limitations:** This is a broad *frontend translation bridge* rather than native Vue-i18n message IDs. Rare newly added strings, unexpected string combinations, embedded charts, and raw Chinese error details returned by the Go backend may still appear untranslated. The server's own log messages are not localized. End-to-end visual testing and the full production build are needed before calling the system independently verified. No OCI credentials or backend logic are changed.

## File layout

| Path | Purpose |
|---|---|
| `web/src/i18n/de.json` | Exact Chinese → German frontend message catalog |
| `web/src/i18n/en.json` | Exact Chinese → English frontend message catalog |
| `web/src/i18n/patterns.json` | Variable message patterns `{0}`, `{1}`, etc. for both languages |
| `web/src/i18n/index.ts` | Language selection, translator, DOM/attribute observer |
| `web/src/components/LanguageSwitcher.vue` | Header/login language selector |
| `web/src/main.ts`, `web/src/router/index.ts` | Initialize translations and translate document title |

## Adding translations

Keep Chinese as the stable source text. When a new static label appears in a Vue component, add its exact original Chinese string as a key to **both** `de.json` and `en.json`.

For a dynamic label such as `` `删除 ${account.alias}` ``, add a `patterns.json` entry like:

```json
{"source":"删除 {0}","de":"{0} löschen","en":"Delete {0}"}
```

Placeholders start at `{0}` and must appear exactly once in source and translation (order can vary). More specific patterns take precedence over shorter ones. Do not put secrets, OCIDs, IPs, SQL queries or API payloads into catalogs. A future refactor can replace the DOM bridge with explicit `$t(...)` keys without changing the data model.

## Building

```bash
cd web
npm ci
npm run build
```

Alternatively, use the root `Dockerfile` / the GitHub Actions Docker workflow. The workflow builds an `edge` image on pushes to `main` for your fork (and a `latest` release image on a version tag).

## Security

Never commit `/app/data`, `master.key`, API PEM keys or OCI database files. The original Dockerfile runs as UID/GID `10001`. Keep your persistent volume and its permissions when switching images. Review incoming upstream changes, especially authentication, encryption, and resource creation/termination.
