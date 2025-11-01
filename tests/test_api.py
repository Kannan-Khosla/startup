"""Integration tests for API endpoints."""

from unittest.mock import Mock, MagicMock, patch
from fastapi import status


class TestHealthCheck:
    """Tests for health check endpoint."""

    def test_health_check(self, app_client):
        """Test health check endpoint."""
        response = app_client.get("/")
        assert response.status_code == status.HTTP_200_OK
        assert "message" in response.json()


class TestTicketCreation:
    """Tests for ticket creation endpoint."""

    def test_create_new_ticket(self, app_client, mock_supabase_client, sample_ticket_request):
        """Test creating a new ticket."""
        # Setup mocks for different table calls
        tickets_table = mock_supabase_client.table("tickets")
        messages_table = mock_supabase_client.table("messages")
        
        # Mock: no existing ticket found (first query)
        tickets_table.select.return_value.eq.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value.data = []
        
        # Mock: insert new ticket
        tickets_table.insert.return_value.execute.return_value.data = [{"id": "new-ticket-id"}]
        
        # Mock: insert customer message (no return needed)
        messages_table.insert.return_value.execute.return_value.data = []
        
        # Mock: fetch history
        messages_table.select.return_value.eq.return_value.order.return_value.execute.return_value.data = [
            {"sender": "customer", "message": "Test message"}
        ]
        
        # Mock: rate limit check returns not limited
        messages_table.select.return_value.eq.return_value.eq.return_value.gte.return_value.execute.return_value.count = 0
        
        # Mock: insert AI message
        messages_table.insert.return_value.execute.return_value.data = [{"id": "ai-message-id"}]
        
        response = app_client.post("/ticket", json=sample_ticket_request)
        assert response.status_code == status.HTTP_200_OK
        assert "ticket_id" in response.json()
        assert "reply" in response.json()

    def test_continue_existing_ticket(self, app_client, mock_supabase_client, sample_ticket_request):
        """Test continuing an existing ticket."""
        tickets_table = mock_supabase_client.table("tickets")
        messages_table = mock_supabase_client.table("messages")
        
        # Mock: existing ticket found
        existing_ticket = {"id": "existing-ticket-id", "assigned_to": None}
        tickets_table.select.return_value.eq.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value.data = [existing_ticket]
        
        # Mock: insert customer message
        messages_table.insert.return_value.execute.return_value.data = []
        
        # Mock: fetch history
        messages_table.select.return_value.eq.return_value.order.return_value.execute.return_value.data = [
            {"sender": "customer", "message": "First message"},
            {"sender": "ai", "message": "AI reply"},
            {"sender": "customer", "message": "Test message"},
        ]
        
        # Mock: rate limit check
        messages_table.select.return_value.eq.return_value.eq.return_value.gte.return_value.execute.return_value.count = 0
        
        # Mock: insert AI message
        messages_table.insert.return_value.execute.return_value.data = [{"id": "ai-message-id"}]
        
        response = app_client.post("/ticket", json=sample_ticket_request)
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["ticket_id"] == "existing-ticket-id"

    def test_ticket_with_assigned_agent(self, app_client, mock_supabase_client, sample_ticket_request):
        """Test ticket with assigned agent skips AI."""
        tickets_table = mock_supabase_client.table("tickets")
        messages_table = mock_supabase_client.table("messages")
        
        # Mock: existing ticket with assigned agent
        existing_ticket = {"id": "assigned-ticket-id", "assigned_to": "agent1"}
        tickets_table.select.return_value.eq.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value.data = [existing_ticket]
        
        # Mock: insert customer message
        messages_table.insert.return_value.execute.return_value.data = []
        
        response = app_client.post("/ticket", json=sample_ticket_request)
        assert response.status_code == status.HTTP_200_OK
        assert "agent1" in response.json()["reply"]
        assert "reply" in response.json()


class TestTicketReply:
    """Tests for ticket reply endpoint."""

    def test_reply_to_ticket(self, app_client, mock_supabase_client, sample_message_request):
        """Test replying to an existing ticket."""
        ticket_id = "test-ticket-id"
        tickets_table = mock_supabase_client.table("tickets")
        messages_table = mock_supabase_client.table("messages")
        
        # Mock: ticket exists
        tickets_table.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = [
            {"id": ticket_id, "assigned_to": None}
        ]
        
        # Mock: insert customer message
        messages_table.insert.return_value.execute.return_value.data = []
        
        # Mock: fetch history
        messages_table.select.return_value.eq.return_value.order.return_value.execute.return_value.data = [
            {"sender": "customer", "message": "Original message"}
        ]
        
        # Mock: rate limit check
        messages_table.select.return_value.eq.return_value.eq.return_value.gte.return_value.execute.return_value.count = 0
        
        # Mock: insert AI message
        messages_table.insert.return_value.execute.return_value.data = [{"id": "ai-message-id"}]
        
        response = app_client.post(f"/ticket/{ticket_id}/reply", json=sample_message_request)
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["ticket_id"] == ticket_id
        assert "reply" in response.json()

    def test_reply_to_nonexistent_ticket(self, app_client, mock_supabase_client, sample_message_request):
        """Test replying to a non-existent ticket."""
        ticket_id = "nonexistent-ticket-id"
        tickets_table = mock_supabase_client.table("tickets")
        
        # Mock: ticket not found
        tickets_table.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = []
        
        response = app_client.post(f"/ticket/{ticket_id}/reply", json=sample_message_request)
        assert response.status_code == status.HTTP_200_OK  # Current implementation returns 200 with error
        assert "error" in response.json()


class TestGetTicket:
    """Tests for get ticket endpoint."""

    def test_get_ticket_thread(self, app_client, mock_supabase_client):
        """Test fetching ticket thread."""
        ticket_id = "test-ticket-id"
        tickets_table = mock_supabase_client.table("tickets")
        messages_table = mock_supabase_client.table("messages")
        
        # Mock: ticket exists
        tickets_table.select.return_value.eq.return_value.limit.return_value.execute.return_value.data = [
            {"id": ticket_id, "context": "test", "subject": "Test"}
        ]
        
        # Mock: messages
        messages_table.select.return_value.eq.return_value.order.return_value.execute.return_value.data = [
            {"id": "msg1", "sender": "customer", "message": "Hello"},
            {"id": "msg2", "sender": "ai", "message": "Hi there"},
        ]
        
        response = app_client.get(f"/ticket/{ticket_id}")
        assert response.status_code == status.HTTP_200_OK
        assert "ticket" in response.json()
        assert "messages" in response.json()
        assert len(response.json()["messages"]) == 2


class TestStats:
    """Tests for stats endpoint."""

    def test_get_stats(self, app_client, mock_supabase_client):
        """Test fetching statistics."""
        tickets_table = mock_supabase_client.table("tickets")
        summary_table = mock_supabase_client.table("ticket_summary")
        
        # Mock total tickets count
        tickets_table.select.return_value.execute.return_value.count = 10
        
        # Mock open tickets count
        tickets_table.select.return_value.eq.return_value.execute.return_value.count = 5
        
        # Mock ticket_summary table
        summary_table.select.return_value.limit.return_value.execute.return_value.data = [
            {"ticket_id": "t1", "status": "open"}
        ]
        
        response = app_client.get("/stats")
        assert response.status_code == status.HTTP_200_OK


class TestAdminEndpoints:
    """Tests for admin endpoints."""

    def test_get_all_tickets(self, app_client, mock_supabase_client):
        """Test getting all tickets."""
        tickets_table = mock_supabase_client.table("tickets")
        
        # Mock: get all tickets
        tickets_table.select.return_value.order.return_value.execute.return_value.data = [
            {"id": "t1", "status": "open"},
            {"id": "t2", "status": "closed"}
        ]
        
        response = app_client.get("/admin/tickets")
        assert response.status_code == status.HTTP_200_OK
        assert "tickets" in response.json()

    def test_assign_agent_without_auth(self, app_client, mock_supabase_client):
        """Test assigning agent (may require auth depending on config)."""
        ticket_id = "test-ticket-id"
        agent_name = "agent1"
        tickets_table = mock_supabase_client.table("tickets")
        
        # Mock: update ticket
        tickets_table.update.return_value.eq.return_value.execute.return_value.data = [
            {"id": ticket_id, "assigned_to": agent_name}
        ]
        
        response = app_client.post(
            f"/admin/ticket/{ticket_id}/assign",
            params={"agent_name": agent_name}
        )
        # Should succeed if no admin token configured, or fail if token required
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED]

    def test_close_ticket(self, app_client, mock_supabase_client):
        """Test closing a ticket."""
        ticket_id = "test-ticket-id"
        tickets_table = mock_supabase_client.table("tickets")
        
        # Mock: update ticket
        tickets_table.update.return_value.eq.return_value.execute.return_value.data = [
            {"id": ticket_id, "status": "closed"}
        ]
        
        response = app_client.post(f"/admin/ticket/{ticket_id}/close")
        # Should succeed if no admin token configured, or fail if token required
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_401_UNAUTHORIZED]

