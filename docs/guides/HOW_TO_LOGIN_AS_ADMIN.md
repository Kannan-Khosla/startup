# How to Login as Admin

## Methods to Create Admin Account

### Method 1: Bootstrap (First Admin Only)

If **no admins exist yet** in the database, you can create the first admin using a bootstrap key:

1. **Set bootstrap key in `.env`:**
   ```
   ADMIN_BOOTSTRAP_KEY=your-secret-bootstrap-key-here
   ```

2. **Create first admin via API:**
   ```bash
   curl -X POST "http://localhost:8000/auth/admin/register?bootstrap_key=your-secret-bootstrap-key-here" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "admin123",
       "name": "Admin User"
     }'
   ```

   Or if `ADMIN_BOOTSTRAP_KEY` is not set, you can create the first admin without any key (when no admins exist).

### Method 2: Register as Customer, Then Upgrade via Database

1. Register a regular customer account through `/auth/register`
2. Manually update the user role in Supabase:
   ```sql
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'your-email@example.com';
   ```
3. Login with that email/password - you'll now be an admin

### Method 3: Direct Database Insert (SQL)

Run this in Supabase SQL Editor (replace values):
```sql
INSERT INTO users (email, password_hash, name, role)
VALUES (
  'admin@example.com',
  '$2b$12$...', -- Use bcrypt hash of your password
  'Admin User',
  'admin'
);
```

To generate bcrypt hash, use Python:
```python
import bcrypt
password = "your-password"
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
print(hashed.decode('utf-8'))
```

### Method 4: Existing Admin Creates New Admin

If you already have an admin account:

1. **Login as admin** via `/auth/login` with admin credentials
2. **Create new admin** via `/auth/admin/register` with your JWT token:
   ```bash
   curl -X POST "http://localhost:8000/auth/admin/register" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "email": "newadmin@example.com",
       "password": "password123",
       "name": "New Admin"
     }'
   ```

## Login Process

Once you have an admin account:

1. **Use the Login page** in the frontend at `/login`
2. **Enter admin email and password**
3. **After login**, you'll be automatically redirected to `/admin` portal

## Quick Setup (Recommended)

**Easiest way for first admin:**

1. Don't set `ADMIN_BOOTSTRAP_KEY` in `.env` (or leave it empty)
2. Call the API:
   ```bash
   curl -X POST "http://localhost:8000/auth/admin/register" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "admin123",
       "name": "First Admin"
     }'
   ```
3. This will create the first admin (since no admins exist yet)
4. Then login at `/login` with those credentials

