"""
Test script for Priority, SLA, and Time Tracking endpoints
Run this after starting the server: python -m uvicorn main:app --reload
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def print_response(title, response):
    """Pretty print API response."""
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'='*60}")
    print(f"Status: {response.status_code}")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)
    print()

def test_endpoints():
    """Test all new endpoints."""
    
    print("🚀 Testing Priority, SLA, and Time Tracking Endpoints")
    print("=" * 60)
    
    # Step 1: Login as admin
    print("\n1️⃣ Testing Admin Login...")
    admin_login = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": "kannankhosla2405@gmail.com",  # Change to your admin email
            "password": "Kannan@123"  # Change to your admin password
        }
    )
    
    if admin_login.status_code != 200:
        print(f"❌ Admin login failed: {admin_login.text}")
        print("\n💡 Tip: Create an admin account first or use existing credentials")
        return
    
    admin_token = admin_login.json().get("access_token")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("✅ Admin login successful")
    
    # Step 2: Create SLA Definitions for all priorities
    print("\n2️⃣ Testing Create SLA Definitions for all priorities...")
    sla_priorities = [
        {"priority": "low", "response_time_minutes": 1440, "resolution_time_minutes": 5760},  # 24h / 96h
        {"priority": "medium", "response_time_minutes": 480, "resolution_time_minutes": 2880},  # 8h / 48h
        {"priority": "high", "response_time_minutes": 240, "resolution_time_minutes": 1440},  # 4h / 24h
        {"priority": "urgent", "response_time_minutes": 60, "resolution_time_minutes": 480},  # 1h / 8h
    ]
    
    for sla_config in sla_priorities:
        sla_data = {
            "name": f"{sla_config['priority'].title()} Priority SLA",
            "description": f"Standard SLA for {sla_config['priority']} priority tickets",
            "priority": sla_config["priority"],
            "response_time_minutes": sla_config["response_time_minutes"],
            "resolution_time_minutes": sla_config["resolution_time_minutes"],
            "business_hours_only": False
        }
        sla_response = requests.post(
            f"{BASE_URL}/admin/slas",
            json=sla_data,
            headers={"Content-Type": "application/json", **admin_headers}
        )
        if sla_response.status_code == 200:
            sla_id = sla_response.json().get("sla", {}).get("id")
            print(f"✅ {sla_config['priority'].title()} SLA created with ID: {sla_id}")
        else:
            print(f"⚠️ {sla_config['priority'].title()} SLA creation failed (may already exist)")
    
    # List all SLAs
    list_slas = requests.get(
        f"{BASE_URL}/admin/slas?is_active=true",
        headers=admin_headers
    )
    print_response("List All SLA Definitions", list_slas)
    
    # Step 4: Login as customer (or create one)
    print("\n4️⃣ Testing Customer Login...")
    customer_login = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": "customer@example.com",  # Change to your customer email
            "password": "customer123"  # Change to your customer password
        }
    )
    
    if customer_login.status_code != 200:
        print(f"⚠️ Customer login failed: {customer_login.text}")
        print("💡 Creating a test customer account...")
        register_response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": "customer@example.com",
                "password": "customer123",
                "name": "Test Customer"
            }
        )
        if register_response.status_code == 200:
            customer_token = register_response.json().get("access_token")
            print("✅ Customer account created")
        else:
            print(f"❌ Customer registration failed: {register_response.text}")
            return
    else:
        customer_token = customer_login.json().get("access_token")
        print("✅ Customer login successful")
    
    customer_headers = {"Authorization": f"Bearer {customer_token}"}
    
    # Step 5: Create a ticket with priority
    print("\n5️⃣ Testing Create Ticket with Priority...")
    ticket_data = {
        "context": "test",
        "subject": "Test Priority Ticket",
        "message": "This is a test ticket with high priority",
        "priority": "high"
    }
    ticket_response = requests.post(
        f"{BASE_URL}/ticket",
        json=ticket_data,
        headers={"Content-Type": "application/json", **customer_headers}
    )
    print_response("Create Ticket with Priority", ticket_response)
    
    if ticket_response.status_code != 200:
        print("❌ Ticket creation failed")
        return
    
    ticket_id = ticket_response.json().get("ticket_id")
    print(f"✅ Ticket created with ID: {ticket_id}")
    
    # Step 6: Update ticket priority (admin only)
    print("\n6️⃣ Testing Update Ticket Priority...")
    update_priority = requests.post(
        f"{BASE_URL}/ticket/{ticket_id}/priority",
        json={"priority": "urgent"},
        headers={"Content-Type": "application/json", **admin_headers}
    )
    print_response("Update Ticket Priority", update_priority)
    
    # Step 7: Get SLA Status
    print("\n7️⃣ Testing Get SLA Status...")
    sla_status = requests.get(
        f"{BASE_URL}/ticket/{ticket_id}/sla-status",
        headers=admin_headers
    )
    print_response("Get SLA Status", sla_status)
    
    # Step 8: Create Time Entry
    print("\n8️⃣ Testing Create Time Entry...")
    time_entry_data = {
        "duration_minutes": 30,
        "description": "Initial investigation and troubleshooting",
        "entry_type": "work",
        "billable": True
    }
    time_entry_response = requests.post(
        f"{BASE_URL}/ticket/{ticket_id}/time-entry",
        json=time_entry_data,
        headers={"Content-Type": "application/json", **admin_headers}
    )
    print_response("Create Time Entry", time_entry_response)
    
    # Step 9: Get Time Entries
    print("\n9️⃣ Testing Get Time Entries...")
    time_entries = requests.get(
        f"{BASE_URL}/ticket/{ticket_id}/time-entries",
        headers=admin_headers
    )
    print_response("Get Time Entries", time_entries)
    
    # Step 10: Admin reply (to trigger first_response_at)
    print("\n🔟 Testing Admin Reply (to trigger first_response_at)...")
    admin_reply = requests.post(
        f"{BASE_URL}/ticket/{ticket_id}/admin/reply",
        json={"message": "Thank you for contacting us. We're looking into this issue."},
        headers={"Content-Type": "application/json", **admin_headers}
    )
    print_response("Admin Reply", admin_reply)
    
    # Step 11: Get SLA Status again (after first response)
    print("\n1️⃣1️⃣ Testing Get SLA Status (after first response)...")
    sla_status_after = requests.get(
        f"{BASE_URL}/ticket/{ticket_id}/sla-status",
        headers=admin_headers
    )
    print_response("Get SLA Status (After Response)", sla_status_after)
    
    print("\n" + "=" * 60)
    print("✅ All tests completed!")
    print("=" * 60)
    print("\n💡 Tips:")
    print("   - Check Swagger UI at http://localhost:8000/docs for interactive testing")
    print("   - Check the database to verify data was saved correctly")
    print("   - Modify email/password in this script to use your actual credentials")

if __name__ == "__main__":
    try:
        test_endpoints()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to server")
        print("💡 Make sure the server is running: python -m uvicorn main:app --reload")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

