# coxof AI DIY V1.0

POD design workspace with a product catalog, BFL FLUX image generation, generated-asset storage, and project persistence.

## Local verification

```bash
npm install
npm run build
npm run lint
```

Vite serves the front end locally. The `/api/*` functions run in a Vercel-compatible environment.

## Required environment variables

Copy `.env.example` values into the Vercel project environment:

- `BFL_API_KEY`: server-only Black Forest Labs key.
- `BFL_MODEL`: defaults to `flux-2-pro-preview`; use `flux-2-pro` for a pinned model.
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only service role key.
- `COXOF_PREVIEW_TOKEN`: temporary operator access gate before full authentication exists.

Never create `VITE_BFL_API_KEY` or `VITE_SUPABASE_SERVICE_ROLE_KEY`. Variables prefixed with `VITE_` are bundled into browser code.

## Database setup

Run `supabase/schema.sql` in the Supabase SQL editor. It creates:

- the `projects` table;
- an index for workspace project history;
- RLS with browser roles revoked;
- a public `generated-assets` bucket that only the server service role can write.

## API flow

1. `POST /api/generations` submits 1–4 asynchronous FLUX jobs.
2. `POST /api/generation-status` checks the BFL-provided polling URL.
3. Ready images are downloaded immediately and copied to Supabase Storage.
4. `POST /api/projects` saves product, prompt, parameters, and output metadata.
5. `GET /api/projects?workspaceId=...` reads the project history.

Generated BFL delivery URLs expire quickly, so the status API copies completed images before returning them to the browser.

## Security boundary

Model and database keys are used only by server functions. On a Vercel deployment, generation remains disabled until `COXOF_PREVIEW_TOKEN` is configured. This temporary gate must be replaced with real user authentication and per-user authorization before public launch.
