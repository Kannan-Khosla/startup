import { useState, useRef } from 'react';
import { uploadAttachment } from '../services/api';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain', 'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip', 'application/x-zip-compressed',
  'video/mp4', 'video/mpeg', 'video/quicktime',
  'audio/mpeg', 'audio/wav', 'audio/mp3',
];

export default function FileUpload({ ticketId, messageId, onUploadSuccess, disabled }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `File type ${file.type} is not allowed`;
    }
    return null;
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      e.target.value = ''; // Reset input
      return;
    }

    setError(null);
    setUploading(true);

    const { data, error: uploadError } = await uploadAttachment(ticketId, file, messageId);

    if (uploadError) {
      setError(uploadError);
    } else {
      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
      // Reset input
      e.target.value = '';
    }

    setUploading(false);
  };

  const handleClick = () => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
          accept={ALLOWED_TYPES.join(',')}
        />
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || uploading}
          className="px-4 py-2 text-sm bg-gray-700/50 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          title="Upload attachment (max 10MB)"
        >
          {uploading ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <span>📎</span>
              <span>Attach File</span>
            </>
          )}
        </button>
      </div>
      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded px-2 py-1">
          {error}
        </div>
      )}
    </div>
  );
}

