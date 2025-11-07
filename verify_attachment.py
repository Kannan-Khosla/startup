#!/usr/bin/env python3
"""
Quick script to verify attachments are uploaded correctly.
Usage: python verify_attachment.py <ticket_id> [attachment_id]
"""

import sys
import requests
import json
from supabase_config import supabase

def verify_attachment(ticket_id: str, attachment_id: str = None):
    """Verify attachment exists in database and storage."""
    
    print(f"🔍 Verifying attachment for ticket: {ticket_id}")
    print("-" * 60)
    
    # 1. Check database record
    print("\n1️⃣ Checking database record...")
    if attachment_id:
        result = supabase.table("attachments").select("*").eq("id", attachment_id).execute()
    else:
        result = supabase.table("attachments").select("*").eq("ticket_id", ticket_id).execute()
    
    if not result.data:
        print("❌ No attachment found in database")
        return False
    
    attachments = result.data
    print(f"✅ Found {len(attachments)} attachment(s) in database:")
    
    for att in attachments:
        print(f"\n   📎 Attachment ID: {att['id']}")
        print(f"   📄 File Name: {att['file_name']}")
        print(f"   📊 File Size: {att['file_size']:,} bytes ({att['file_size'] / 1024:.2f} KB)")
        print(f"   🏷️  MIME Type: {att['mime_type']}")
        print(f"   📁 Storage Path: {att['file_path']}")
        print(f"   👤 Uploaded By: {att['uploaded_by']}")
        print(f"   📅 Created At: {att['created_at']}")
        
        # 2. Check if file exists in storage
        print(f"\n2️⃣ Checking storage for: {att['file_path']}...")
        try:
            storage = supabase.storage
            file_content = storage.from_("attachments").download(att['file_path'])
            
            if file_content:
                print(f"   ✅ File exists in storage ({len(file_content)} bytes)")
                print(f"   ✅ File size matches: {len(file_content) == att['file_size']}")
            else:
                print(f"   ❌ File not found in storage")
        except Exception as e:
            print(f"   ❌ Error checking storage: {e}")
    
    print("\n" + "-" * 60)
    print("✅ Verification complete!")
    return True


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python verify_attachment.py <ticket_id> [attachment_id]")
        sys.exit(1)
    
    ticket_id = sys.argv[1]
    attachment_id = sys.argv[2] if len(sys.argv) > 2 else None
    
    verify_attachment(ticket_id, attachment_id)

