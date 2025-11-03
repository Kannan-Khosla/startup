import { useState } from 'react';
import { escalateToHuman } from '../services/api';

export default function EscalateButton({ ticketId, onEscalate }) {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEscalate = async () => {
    if (loading) return;

    setLoading(true);
    const { error } = await escalateToHuman(ticketId, reason.trim() || null);
    
    if (!error) {
      setShowModal(false);
      setReason('');
      if (onEscalate) onEscalate();
      alert('Human support requested. An agent will assist you shortly.');
    } else {
      alert(`Failed to escalate: ${error}`);
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium"
      >
        Connect to Human
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Request Human Support</h3>
            <p className="text-sm text-gray-400 mb-4">
              Would you like to connect with a human agent? You can optionally provide a reason.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
              rows={3}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEscalate}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Requesting...' : 'Request Support'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

