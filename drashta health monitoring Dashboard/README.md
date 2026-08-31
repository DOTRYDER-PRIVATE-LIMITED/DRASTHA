## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Configure the `.env` file with the Supabase/PostgreSQL credentials:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_ANON_KEY`
   - `DATABASE_URL`
3. Run the app:
   `npm run dev`

### Environment Configuration

Create a `.env` file in the dashboard root directory:

```env
# Supabase / PostgreSQL Configuration
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
DATABASE_URL=
