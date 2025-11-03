# Database Migrations

This directory contains SQL migration files for the database schema.

## How to Run Migrations

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard:**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Sign in and select your project

2. **Navigate to SQL Editor:**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query" button

3. **Run the Migration:**
   - Copy the entire contents of `001_add_users_and_auth.sql`
   - Paste it into the SQL Editor
   - Click "Run" button (or press `Ctrl+Enter` / `Cmd+Enter`)

4. **Verify:**
   - Check the "Results" section for any errors
   - Verify tables were created in "Table Editor" section

### Option 2: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Make sure you're authenticated
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run the migration
supabase db push --file migrations/001_add_users_and_auth.sql
```

### Option 3: Using psql (Command Line)

If you have direct PostgreSQL access:

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the migration
\i migrations/001_add_users_and_auth.sql
```

## Migration Files

- **001_add_users_and_auth.sql** - Creates users, ratings, and human_escalations tables, adds user_id to tickets table, and creates necessary indexes.

## Important Notes

1. **Run migrations in order** - If you have multiple migration files, run them sequentially (001, 002, etc.)

2. **Backup first** - Before running migrations on production, make sure to backup your database

3. **Verify existing schema** - Make sure the `tickets` and `messages` tables exist before running this migration (from the original `database_schema.sql`)

4. **Test environment** - Always test migrations on a development/staging environment first

## Troubleshooting

If you encounter errors:

- **"relation already exists"** - Some tables may already exist. The migration uses `CREATE TABLE IF NOT EXISTS` to handle this safely.

- **"column already exists"** - The migration uses `ADD COLUMN IF NOT EXISTS` for the `user_id` column.

- **Foreign key errors** - Make sure the `tickets` and `messages` tables exist before running this migration.

