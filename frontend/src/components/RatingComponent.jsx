import { useState } from 'react';
import { rateResponse } from '../services/api';

export default function RatingComponent({ ticketId, messageId, initialRating = null }) {
  const [rating, setRating] = useState(initialRating);
  const [hovered, setHovered] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleRating = async (value) => {
    if (loading) return;
    
    setLoading(true);
    const { error } = await rateResponse(ticketId, messageId, value);
    
    if (!error) {
      setRating(value);
    } else {
      alert(`Failed to rate: ${error}`);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-1 mt-2">
      <span className="text-xs text-gray-400 mr-2">Rate:</span>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleRating(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          disabled={loading}
          className={`text-xl transition-all ${
            star <= (hovered || rating || 0)
              ? 'text-yellow-400'
              : 'text-gray-600 hover:text-gray-500'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

