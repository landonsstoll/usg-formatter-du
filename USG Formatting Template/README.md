# USG Formatter — Netlify deploy

Structure
- `public/` — the site (index.html, auth.js, templates-api.js, assets/)
- `functions/templates.js` — per-account template storage (Netlify Identity + Netlify Blobs)
- `netlify.toml`, `package.json` — tells Netlify where things are and which package the function needs

Deploy (one-time setup, then one command)
1. Install the Netlify CLI: `npm install -g netlify-cli`
2. In this folder: `npm install`
3. `netlify login`, then `netlify link` (pick your existing site — Identity is already enabled there)
4. Deploy: `netlify deploy --prod`

Netlify Drop (drag-and-drop) will NOT run the function — use the CLI or connect this folder to a Git repo.

Netlify Blobs is enabled automatically for sites with functions; no extra setup. Each signed-in user's templates are stored under their Identity user ID.
