# Project Structure

This document describes the cleaned and restructured project organization.

## Cleanup Summary

### Files Deleted
- ✅ `check_migrations.sql` - Temporary diagnostic file
- ✅ `diagnose_migration_11.sql` - Temporary diagnostic file
- ✅ `tester.html` - Test HTML file
- ✅ `test_new_endpoints.sh` - Test script
- ✅ `verify_attachment.py` - Verification script
- ✅ `migrations/011_ticket_tags_and_categories_fixed.sql` - Duplicate migration
- ✅ `PROJECT_OVERVIEW.txt` - Consolidated into README.md
- ✅ All `__pycache__/` directories - Python cache (now in .gitignore)

### Files Moved

**Documentation:**
- `ATTACHMENTS_SETUP.md` → `docs/setup/`
- `EMAIL_SETUP_GUIDE.md` → `docs/setup/`
- `GMAIL_APP_PASSWORD_FIX.md` → `docs/setup/`
- `HOW_TO_LOGIN_AS_ADMIN.md` → `docs/guides/`
- `EMAIL_ACCOUNT_TROUBLESHOOTING.md` → `docs/troubleshooting/`
- `FIX_ADMIN_REPLY.md` → `docs/troubleshooting/`
- `CAPABILITIES_PRESENTATION.md` → `docs/`
- `EXECUTIVE_SUMMARY.md` → `docs/`
- `TESTING_GUIDE.md` → `docs/`

**Tests:**
- `test_priority_sla_endpoints.py` → `tests/`

### New Directories Created
- ✅ `docs/setup/` - Setup and installation guides
- ✅ `docs/troubleshooting/` - Troubleshooting guides
- ✅ `docs/guides/` - How-to guides
- ✅ `scripts/` - Utility scripts directory

## Current Structure

```
startup/
├── Backend Python Files (Root Level)
│   ├── main.py                 # FastAPI application
│   ├── config.py               # Configuration
│   ├── auth.py                 # Authentication
│   ├── logger.py               # Logging
│   ├── middleware.py           # Middleware
│   ├── email_service.py        # Email service
│   ├── routing_service.py      # Routing service
│   ├── storage.py              # File storage
│   └── supabase_config.py      # Supabase config
│
├── frontend/                   # React frontend
│   └── [React application structure]
│
├── migrations/                 # Database migrations
│   └── [Migration files in order]
│
├── tests/                      # All tests
│   ├── test_api.py
│   ├── test_helpers.py
│   ├── test_priority_sla_endpoints.py
│   └── conftest.py
│
├── docs/                       # All documentation
│   ├── setup/                  # Setup guides
│   ├── troubleshooting/        # Troubleshooting
│   ├── guides/                 # How-to guides
│   └── [Main documentation files]
│
├── scripts/                    # Utility scripts
│   └── README.md
│
├── requirements.txt            # Python dependencies
├── .gitignore                  # Git ignore rules
└── README.md                   # Main README
```

## Notes

- Backend Python files remain at root level to maintain import compatibility
- All documentation is now organized in `docs/` with subdirectories
- Test files are consolidated in `tests/`
- `.gitignore` has been updated to exclude cache files and build artifacts
- All functionality remains intact - no breaking changes

