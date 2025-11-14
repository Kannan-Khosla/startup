# File Attachments Setup Guide

## Overview

File attachment endpoints have been added to support uploading, downloading, listing, and deleting attachments for tickets. All files are stored in Supabase Storage.

## Endpoints

### 1. Upload Attachment
**POST** `/ticket/{ticket_id}/attachments`

Upload a file attachment to a ticket.

**Request:**
- `file`: File to upload (multipart/form-data)
- `message_id`: (Optional) Message ID to associate attachment with

**Response:**
```json
{
  "success": true,
  "attachment": {
    "id": "uuid",
    "ticket_id": "uuid",
    "message_id": "uuid",
    "file_name": "example.pdf",
    "file_path": "ticket_id/uuid.pdf",
    "file_size": 1024,
    "mime_type": "application/pdf",
    "uploaded_by": "uuid",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Example (curl):**
```bash
curl -X POST "http://localhost:8000/ticket/{ticket_id}/attachments" \
  -H "Authorization: Bearer {token}" \
  -F "file=@/path/to/file.pdf" \
  -F "message_id={message_id}"
```

### 2. List Attachments
**GET** `/ticket/{ticket_id}/attachments?message_id={message_id}`

List all attachments for a ticket (optionally filtered by message).

**Query Parameters:**
- `message_id`: (Optional) Filter attachments by message ID

**Response:**
```json
{
  "attachments": [
    {
      "id": "uuid",
      "ticket_id": "uuid",
      "message_id": "uuid",
      "file_name": "example.pdf",
      "file_path": "ticket_id/uuid.pdf",
      "file_size": 1024,
      "mime_type": "application/pdf",
      "uploaded_by": "uuid",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

### 3. Download Attachment
**GET** `/attachment/{attachment_id}`

Download an attachment file.

**Response:**
- File stream with appropriate Content-Type and Content-Disposition headers

**Example (curl):**
```bash
curl -X GET "http://localhost:8000/attachment/{attachment_id}" \
  -H "Authorization: Bearer {token}" \
  -o downloaded_file.pdf
```

### 4. Delete Attachment
**DELETE** `/attachment/{attachment_id}`

Delete an attachment (both file and database record).

**Response:**
```json
{
  "success": true,
  "message": "Attachment deleted successfully"
}
```

## File Restrictions

### Maximum File Size
- **10MB** per file

### Allowed MIME Types
- **Images**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- **Documents**: `application/pdf`, `text/plain`, `text/csv`
- **Office**: `.doc`, `.docx`, `.xls`, `.xlsx`
- **Archives**: `application/zip`, `application/x-zip-compressed`
- **Media**: `video/mp4`, `video/mpeg`, `video/quicktime`, `audio/mpeg`, `audio/wav`, `audio/mp3`

## Supabase Storage Setup

### 1. Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name: `attachments`
4. Set as **Private** (recommended for security)
5. Click "Create bucket"

### 2. Get Service Role Key (Required for Uploads)

To bypass Row Level Security (RLS) for storage operations, you need to use the service role key:

1. Go to Supabase Dashboard → Settings → API
2. Find the **Service Role Key** (not the anon key)
3. Copy the service role key
4. Add it to your `.env` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

**Important:** The service role key bypasses RLS and should be kept secret. Never expose it in client-side code.

### 3. Configure Bucket Policies (Optional - if not using service role key)

Set up Row Level Security (RLS) policies for the bucket:

**Policy for Upload (INSERT):**
```sql
CREATE POLICY "Users can upload attachments to their tickets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM tickets WHERE user_id = auth.uid()
  )
);
```

**Policy for Download (SELECT):**
```sql
CREATE POLICY "Users can download attachments from their tickets"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM tickets WHERE user_id = auth.uid()
  )
);
```

**Policy for Delete:**
```sql
CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'attachments' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM tickets WHERE user_id = auth.uid()
  )
);
```

**Note:** If you're using the service role key (recommended), you don't need to configure these policies as the service role key bypasses RLS. The code will automatically use the service role key for all storage operations.

## Authentication & Authorization

All endpoints require authentication via JWT token.

### Access Control:
- **Customers**: Can only upload/view/delete attachments for their own tickets
- **Admins**: Can upload/view/delete attachments for any ticket
- **Delete**: Customers can only delete their own uploads; admins can delete any attachment

## Database Schema

The `attachments` table (created by migration 003) stores:
- `id`: UUID primary key
- `ticket_id`: Foreign key to tickets table
- `message_id`: Optional foreign key to messages table
- `file_name`: Original file name
- `file_path`: Storage path in Supabase Storage
- `file_size`: File size in bytes
- `mime_type`: MIME type of the file
- `uploaded_by`: Foreign key to users table
- `is_public`: Whether file is publicly accessible (default: false)
- `created_at`: Timestamp
- `updated_at`: Timestamp

## Testing

### Using Swagger UI
1. Go to `http://localhost:8000/docs`
2. Authenticate using `/auth/login`
3. Test the attachment endpoints

### Using curl
```bash
# 1. Login
TOKEN=$(curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}' \
  | jq -r '.access_token')

# 2. Upload attachment
curl -X POST "http://localhost:8000/ticket/{ticket_id}/attachments" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf"

# 3. List attachments
curl -X GET "http://localhost:8000/ticket/{ticket_id}/attachments" \
  -H "Authorization: Bearer $TOKEN"

# 4. Download attachment
curl -X GET "http://localhost:8000/attachment/{attachment_id}" \
  -H "Authorization: Bearer $TOKEN" \
  -o downloaded.pdf

# 5. Delete attachment
curl -X DELETE "http://localhost:8000/attachment/{attachment_id}" \
  -H "Authorization: Bearer $TOKEN"
```

## Error Handling

Common errors:
- **400 Bad Request**: Invalid file type or file size too large
- **403 Forbidden**: User doesn't have access to the ticket/attachment
- **404 Not Found**: Ticket or attachment not found
- **500 Internal Server Error**: Storage or database error

## Files Created/Modified

1. **`storage.py`**: New file with Supabase Storage operations
2. **`main.py`**: Added 4 new endpoints for attachment management
3. **`migrations/003_attachments.sql`**: Database schema (already exists)

## Next Steps

1. Create the `attachments` bucket in Supabase Storage
2. **Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env` file** (required for uploads to work)
3. Restart your FastAPI server
4. Test the endpoints using Swagger UI or curl
5. File upload UI is already integrated in the frontend

## Troubleshooting

### Error: "new row violates row-level security policy"

This error occurs when:
- The service role key is not set in `.env`
- The storage bucket doesn't exist
- RLS policies are blocking the operation

**Solution:**
1. Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in your `.env` file
2. Verify the `attachments` bucket exists in Supabase Storage
3. Restart your FastAPI server after adding the service role key

