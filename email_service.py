"""Email service for sending and receiving emails via SMTP or email APIs."""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
import re
import email
from email.header import decode_header
import httpx
from logger import setup_logger
from supabase_config import supabase
from config import settings

logger = setup_logger(__name__)


class EmailService:
    """Email service supporting SMTP and API providers."""
    
    def __init__(self):
        self.supabase = supabase
    
    def get_email_account(self, account_id: str) -> Optional[Dict]:
        """Get email account configuration."""
        try:
            result = self.supabase.table("email_accounts").select("*").eq("id", account_id).limit(1).execute()
            if result.data:
                return result.data[0]
            return None
        except Exception as e:
            logger.error(f"Error getting email account: {e}", exc_info=True)
            return None
    
    def get_default_email_account(self) -> Optional[Dict]:
        """Get default email account. Falls back to any active account if no default is set."""
        try:
            # First, try to get the default active account
            result = (
                self.supabase.table("email_accounts")
                .select("*")
                .eq("is_default", True)
                .eq("is_active", True)
                .limit(1)
                .execute()
            )
            if result.data:
                logger.info(f"Found default email account: {result.data[0].get('email')}")
                return result.data[0]
            
            # Fallback: Get any active account if no default is set
            logger.warning("No default email account found. Trying to find any active account...")
            fallback_result = (
                self.supabase.table("email_accounts")
                .select("*")
                .eq("is_active", True)
                .limit(1)
                .execute()
            )
            if fallback_result.data:
                logger.info(f"Using fallback active email account: {fallback_result.data[0].get('email')}")
                return fallback_result.data[0]
            
            # No active accounts found
            logger.error("No active email accounts found in database")
            return None
        except Exception as e:
            logger.error(f"Error getting default email account: {e}", exc_info=True)
            return None
    
    def decrypt_credentials(self, encrypted_data: str) -> str:
        """Decrypt credentials. Placeholder - implement proper encryption."""
        # TODO: Implement proper encryption/decryption
        # For now, return as-is (assumes credentials are stored securely)
        return encrypted_data
    
    def send_email_smtp(
        self,
        account: Dict,
        to_emails: List[str],
        subject: str,
        body_text: str,
        body_html: Optional[str] = None,
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None,
        reply_to: Optional[str] = None,
        attachments: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:
        """Send email via SMTP."""
        try:
            smtp_host = account.get("smtp_host")
            smtp_port = account.get("smtp_port", 587)
            smtp_username = account.get("smtp_username")
            smtp_password = self.decrypt_credentials(account.get("smtp_password_encrypted", ""))
            from_email = account.get("email")
            display_name = account.get("display_name", "")
            
            # Create message
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{display_name} <{from_email}>" if display_name else from_email
            msg["To"] = ", ".join(to_emails)
            msg["Subject"] = subject
            
            if reply_to:
                msg["Reply-To"] = reply_to
            
            if cc_emails:
                msg["Cc"] = ", ".join(cc_emails)
            
            # Add body
            msg.attach(MIMEText(body_text, "plain"))
            if body_html:
                msg.attach(MIMEText(body_html, "html"))
            
            # Add attachments
            if attachments:
                for att in attachments:
                    part = MIMEBase("application", "octet-stream")
                    part.set_payload(att["content"])
                    encoders.encode_base64(part)
                    part.add_header(
                        "Content-Disposition",
                        f'attachment; filename="{att["filename"]}"'
                    )
                    msg.attach(part)
            
            # Connect and send
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_username, smtp_password)
                all_recipients = to_emails + (cc_emails or []) + (bcc_emails or [])
                server.send_message(msg, to_addrs=all_recipients)
            
            logger.info(f"Email sent via SMTP to {to_emails}")
            return {"success": True, "message_id": msg["Message-ID"]}
            
        except Exception as e:
            logger.error(f"Error sending email via SMTP: {e}", exc_info=True)
            return {"success": False, "error": str(e)}
    
    def send_email_sendgrid(
        self,
        account: Dict,
        to_emails: List[str],
        subject: str,
        body_text: str,
        body_html: Optional[str] = None,
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None,
        reply_to: Optional[str] = None,
        attachments: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:
        """Send email via SendGrid API."""
        try:
            api_key = self.decrypt_credentials(account.get("api_key_encrypted", ""))
            from_email = account.get("email")
            display_name = account.get("display_name", "")
            
            url = "https://api.sendgrid.com/v3/mail/send"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            data = {
                "personalizations": [{
                    "to": [{"email": email} for email in to_emails],
                }],
                "from": {
                    "email": from_email,
                    "name": display_name or ""
                },
                "subject": subject,
                "content": [
                    {
                        "type": "text/plain",
                        "value": body_text
                    }
                ]
            }
            
            if cc_emails:
                data["personalizations"][0]["cc"] = [{"email": email} for email in cc_emails]
            
            if bcc_emails:
                data["personalizations"][0]["bcc"] = [{"email": email} for email in bcc_emails]
            
            if body_html:
                data["content"].append({
                    "type": "text/html",
                    "value": body_html
                })
            
            if reply_to:
                data["reply_to"] = {"email": reply_to}
            
            if attachments:
                data["attachments"] = [
                    {
                        "content": att["content"].decode("base64") if isinstance(att["content"], bytes) else att["content"],
                        "filename": att["filename"],
                        "type": att.get("content_type", "application/octet-stream"),
                        "disposition": "attachment"
                    }
                    for att in attachments
                ]
            
            response = httpx.post(url, headers=headers, json=data, timeout=30.0)
            response.raise_for_status()
            
            logger.info(f"Email sent via SendGrid to {to_emails}")
            return {"success": True, "message_id": response.headers.get("X-Message-Id")}
            
        except Exception as e:
            logger.error(f"Error sending email via SendGrid: {e}", exc_info=True)
            return {"success": False, "error": str(e)}
    
    def send_email_ses(
        self,
        account: Dict,
        to_emails: List[str],
        subject: str,
        body_text: str,
        body_html: Optional[str] = None,
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None,
        reply_to: Optional[str] = None,
        attachments: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:
        """Send email via AWS SES API."""
        try:
            # AWS SES requires boto3, but we'll use HTTP API for now
            # This is a simplified version - in production, use boto3
            credentials = json.loads(self.decrypt_credentials(account.get("credentials_encrypted", "{}")))
            aws_access_key = credentials.get("access_key_id")
            aws_secret_key = credentials.get("secret_access_key")
            aws_region = credentials.get("region", "us-east-1")
            from_email = account.get("email")
            
            # Note: AWS SES API requires AWS Signature Version 4 signing
            # For production, use boto3 library instead
            logger.warning("AWS SES direct API not fully implemented. Use boto3 for production.")
            return {"success": False, "error": "AWS SES requires boto3 library"}
            
        except Exception as e:
            logger.error(f"Error sending email via AWS SES: {e}", exc_info=True)
            return {"success": False, "error": str(e)}
    
    def send_email(
        self,
        account_id: Optional[str] = None,
        to_emails: List[str] = None,
        subject: str = "",
        body_text: str = "",
        body_html: Optional[str] = None,
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None,
        reply_to: Optional[str] = None,
        attachments: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:
        """Send email using configured account."""
        # Get account
        if account_id:
            account = self.get_email_account(account_id)
        else:
            account = self.get_default_email_account()
        
        if not account:
            return {"success": False, "error": "No email account configured"}
        
        if not account.get("is_active"):
            return {"success": False, "error": "Email account is not active"}
        
        provider = account.get("provider", "smtp")
        
        # Route to appropriate provider
        if provider == "smtp":
            return self.send_email_smtp(
                account, to_emails, subject, body_text, body_html,
                cc_emails, bcc_emails, reply_to, attachments
            )
        elif provider == "sendgrid":
            return self.send_email_sendgrid(
                account, to_emails, subject, body_text, body_html,
                cc_emails, bcc_emails, reply_to, attachments
            )
        elif provider == "ses":
            return self.send_email_ses(
                account, to_emails, subject, body_text, body_html,
                cc_emails, bcc_emails, reply_to, attachments
            )
        else:
            return {"success": False, "error": f"Unsupported provider: {provider}"}
    
    def test_email_connection(self, account_id: str) -> Dict[str, Any]:
        """Test email account connection."""
        account = self.get_email_account(account_id)
        if not account:
            return {"success": False, "error": "Email account not found"}
        
        provider = account.get("provider", "smtp")
        
        if provider == "smtp":
            try:
                smtp_host = account.get("smtp_host")
                smtp_port = account.get("smtp_port", 587)
                smtp_username = account.get("smtp_username")
                smtp_password = self.decrypt_credentials(account.get("smtp_password_encrypted", ""))
                
                with smtplib.SMTP(smtp_host, smtp_port) as server:
                    server.starttls()
                    server.login(smtp_username, smtp_password)
                
                return {"success": True, "message": "SMTP connection successful"}
            except Exception as e:
                return {"success": False, "error": str(e)}
        
        elif provider == "sendgrid":
            try:
                api_key = self.decrypt_credentials(account.get("api_key_encrypted", ""))
                response = httpx.get(
                    "https://api.sendgrid.com/v3/user/profile",
                    headers={"Authorization": f"Bearer {api_key}"},
                    timeout=10.0
                )
                response.raise_for_status()
                return {"success": True, "message": "SendGrid API connection successful"}
            except Exception as e:
                return {"success": False, "error": str(e)}
        
        else:
            return {"success": False, "error": f"Test not implemented for provider: {provider}"}
    
    def parse_email(self, raw_email: str) -> Dict[str, Any]:
        """Parse raw email content."""
        try:
            msg = email.message_from_string(raw_email)
            
            # Decode headers
            subject = self._decode_header(msg.get("Subject", ""))
            from_email = self._extract_email(msg.get("From", ""))
            to_emails = [self._extract_email(addr) for addr in msg.get_all("To", [])]
            cc_emails = [self._extract_email(addr) for addr in msg.get_all("Cc", [])]
            message_id = msg.get("Message-ID", "")
            in_reply_to = msg.get("In-Reply-To", "")
            references = msg.get("References", "")
            
            # Extract body
            body_text = ""
            body_html = ""
            
            if msg.is_multipart():
                for part in msg.walk():
                    content_type = part.get_content_type()
                    if content_type == "text/plain":
                        body_text = part.get_payload(decode=True).decode("utf-8", errors="ignore")
                    elif content_type == "text/html":
                        body_html = part.get_payload(decode=True).decode("utf-8", errors="ignore")
            else:
                content_type = msg.get_content_type()
                payload = msg.get_payload(decode=True).decode("utf-8", errors="ignore")
                if content_type == "text/html":
                    body_html = payload
                else:
                    body_text = payload
            
            # Extract attachments
            attachments = []
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_disposition() == "attachment":
                        filename = part.get_filename()
                        if filename:
                            attachments.append({
                                "filename": self._decode_header(filename),
                                "content": part.get_payload(decode=True),
                                "content_type": part.get_content_type()
                            })
            
            return {
                "subject": subject,
                "from_email": from_email,
                "to_emails": to_emails,
                "cc_emails": cc_emails,
                "message_id": message_id,
                "in_reply_to": in_reply_to,
                "references": references,
                "body_text": body_text,
                "body_html": body_html,
                "attachments": attachments,
                "date": msg.get("Date", "")
            }
        except Exception as e:
            logger.error(f"Error parsing email: {e}", exc_info=True)
            return {}
    
    def _decode_header(self, header: str) -> str:
        """Decode email header."""
        try:
            decoded_parts = decode_header(header)
            decoded_string = ""
            for part, encoding in decoded_parts:
                if isinstance(part, bytes):
                    decoded_string += part.decode(encoding or "utf-8", errors="ignore")
                else:
                    decoded_string += part
            return decoded_string
        except Exception:
            return header
    
    def _extract_email(self, address_string: str) -> str:
        """Extract email address from 'Name <email@domain.com>' format."""
        match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', address_string)
        return match.group(0) if match else address_string.strip()


# Global email service instance
email_service = EmailService()

