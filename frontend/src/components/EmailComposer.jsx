import { useState } from 'react';
import { sendEmailFromTicket } from '../services/api';

export default function EmailComposer({ ticketId, onSent, onCancel, initialTo = '', initialSubject = '' }) {
  const [toEmails, setToEmails] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [bodyText, setBodyText] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [ccEmails, setCcEmails] = useState('');
  const [bccEmails, setBccEmails] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [useHtml, setUseHtml] = useState(false);

  const handleSend = async () => {
    if (!toEmails.trim()) {
      setError('Recipient email is required');
      return;
    }

    if (!subject.trim()) {
      setError('Subject is required');
      return;
    }

    if (!bodyText.trim() && !bodyHtml.trim()) {
      setError('Email body is required');
      return;
    }

    setError(null);
    setSending(true);

    const emailData = {
      to_emails: toEmails.split(',').map(e => e.trim()).filter(e => e),
      subject: subject.trim(),
      body_text: bodyText.trim(),
      body_html: useHtml && bodyHtml.trim() ? bodyHtml.trim() : null,
      cc_emails: ccEmails ? ccEmails.split(',').map(e => e.trim()).filter(e => e) : null,
      bcc_emails: bccEmails ? bccEmails.split(',').map(e => e.trim()).filter(e => e) : null,
      reply_to: replyTo.trim() || null,
    };

    const { data, error: sendError } = await sendEmailFromTicket(ticketId, emailData);

    if (sendError) {
      setError(sendError);
      setSending(false);
    } else {
      if (onSent) {
        onSent(data);
      }
      // Reset form
      setToEmails('');
      setSubject('');
      setBodyText('');
      setBodyHtml('');
      setCcEmails('');
      setBccEmails('');
      setReplyTo('');
      setSending(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Send Email</h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          To <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={toEmails}
          onChange={(e) => setToEmails(e.target.value)}
          placeholder="email@example.com (comma-separated for multiple)"
          disabled={sending}
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Subject <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Email subject"
          disabled={sending}
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="useHtml"
          checked={useHtml}
          onChange={(e) => setUseHtml(e.target.checked)}
          className="w-4 h-4 text-orange-500 bg-gray-900 border-gray-700 rounded focus:ring-orange-500"
        />
        <label htmlFor="useHtml" className="text-sm text-gray-300">
          Use HTML format
        </label>
      </div>

      {useHtml ? (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            HTML Body <span className="text-red-400">*</span>
          </label>
          <textarea
            value={bodyHtml}
            onChange={(e) => setBodyHtml(e.target.value)}
            placeholder="HTML email content"
            disabled={sending}
            rows={10}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 font-mono text-sm"
          />
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Body <span className="text-red-400">*</span>
          </label>
          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            placeholder="Email message"
            disabled={sending}
            rows={10}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            CC (optional)
          </label>
          <input
            type="text"
            value={ccEmails}
            onChange={(e) => setCcEmails(e.target.value)}
            placeholder="cc@example.com"
            disabled={sending}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            BCC (optional)
          </label>
          <input
            type="text"
            value={bccEmails}
            onChange={(e) => setBccEmails(e.target.value)}
            placeholder="bcc@example.com"
            disabled={sending}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Reply-To (optional)
        </label>
        <input
          type="email"
          value={replyTo}
          onChange={(e) => setReplyTo(e.target.value)}
          placeholder="reply@example.com"
          disabled={sending}
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSend}
          disabled={sending || !toEmails.trim() || !subject.trim() || (!bodyText.trim() && !bodyHtml.trim())}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {sending ? 'Sending...' : 'Send Email'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={sending}
            className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

