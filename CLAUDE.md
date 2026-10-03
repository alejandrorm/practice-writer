# PracticeWriter

A webapp for practicing writing in French (target) for a native Spanish speaker. Users write journal entries mixing Spanish and French; the app analyzes each completed sentence with Claude Haiku and shows correction/translation suggestions.

## Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 (CSS-based config in globals.css — no tailwind.config.js)
- **Database + Auth**: Supabase (PostgreSQL + Supabase Auth)
- **ORM**: Drizzle ORM (`src/lib/db/schema.ts`)
- **AI**: Claude Haiku via Anthropic SDK (`src/lib/ai/analyze.ts`)

## Development setup

1. Create a Supabase project at supabase.com
2. Copy `.env.local` values from Settings > API (URL, anon key) and Settings > Database (connection string)
3. Add your `ANTHROPIC_API_KEY`
4. Run `npm run db:push` to create tables in Supabase
5. Run `npm run dev`

## Key commands

```bash
npm run dev          # start dev server
npm run db:push      # push schema to database (use after schema changes)
npm run db:generate  # generate migration files
npm run build        # production build
```

## Project structure

```
src/
  app/
    (auth)/login|register    # auth pages (public)
    (app)/                   # protected app shell
      documents/             # document list + editor
      corrections/           # global corrections browser
    api/                     # REST API routes
  components/
    editor/                  # WritingEditor, SuggestionPopover, CorrectionsSidePanel, DocumentTitle
    documents/               # CreateDocumentButton
    LogoutButton.tsx
  lib/
    db/schema.ts             # Drizzle schema (documents, corrections)
    db/index.ts              # db connection
    supabase/client.ts       # browser Supabase client
    supabase/server.ts       # server Supabase client
    ai/analyze.ts            # Claude Haiku sentence analysis
  middleware.ts              # auth guard
```

## Supabase RLS policies (run after db:push)

```sql
-- Enable RLS on both tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE corrections ENABLE ROW LEVEL SECURITY;

-- Documents: users own their rows
CREATE POLICY "Users manage own documents" ON documents
  USING (user_id = auth.uid());

-- Corrections: users own their rows  
CREATE POLICY "Users manage own corrections" ON corrections
  USING (user_id = auth.uid());
```
