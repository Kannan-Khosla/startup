function formatTimestamp(timestamp) {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch {
    return timestamp;
  }
}

export default function MessageBubble({ message }) {
  const isAI = message.sender === 'ai';
  
  return (
    <div
      className={`max-w-[70%] p-5 rounded-2xl border-2 shadow-lg animate-fade-in hover-lift transition-all duration-300 ${
        isAI
          ? 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-[#ff6b35] ml-auto hover:shadow-xl hover:shadow-[#ff6b35]/25'
          : 'bg-white border-border mr-auto hover:border-[#0f149a] hover:shadow-xl hover:shadow-[#0f149a]/15'
      }`}
    >
      <div className="text-xs text-muted mb-3 font-semibold flex items-center gap-2">
        <span className="uppercase tracking-wider text-[#0f149a]">{message.sender}</span>
        <span className="text-muted">•</span>
        <span className="font-light">{formatTimestamp(message.created_at)}</span>
      </div>
      <div className="text-sm whitespace-pre-wrap leading-relaxed text-text font-medium">
        {message.message || ''}
      </div>
    </div>
  );
}

