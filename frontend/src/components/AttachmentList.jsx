import { useState } from 'react';
import { downloadAttachment, deleteAttachment } from '../services/api';

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function getFileIcon(mimeType) {
  if (mimeType?.startsWith('image/')) return '🖼️';
  if (mimeType?.startsWith('video/')) return '🎥';
  if (mimeType?.startsWith('audio/')) return '🎵';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝';
  if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return '📊';
  if (mimeType?.includes('zip') || mimeType?.includes('compressed')) return '📦';
  return '📎';
}

export default function AttachmentList({ attachments, ticketId, currentUserId, userRole, onDelete }) {
  const [downloading, setDownloading] = useState({});
  const [deleting, setDeleting] = useState({});

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handleDownload = async (attachmentId, fileName) => {
    setDownloading({ ...downloading, [attachmentId]: true });
    const { error } = await downloadAttachment(attachmentId);
    if (error) {
      alert(`Failed to download: ${error}`);
    }
    setDownloading({ ...downloading, [attachmentId]: false });
  };

  const handleDelete = async (attachmentId) => {
    if (!confirm('Are you sure you want to delete this attachment?')) return;
    
    setDeleting({ ...deleting, [attachmentId]: true });
    const { error } = await deleteAttachment(attachmentId);
    if (error) {
      alert(`Failed to delete: ${error}`);
    } else {
      if (onDelete) onDelete();
    }
    setDeleting({ ...deleting, [attachmentId]: false });
  };

  return (
    <div className="mt-3 space-y-2">
      {attachments.map((attachment) => {
        const canDelete = userRole === 'admin' || attachment.uploaded_by === currentUserId;
        const isDownloading = downloading[attachment.id];
        const isDeleting = deleting[attachment.id];
        
        return (
          <div
            key={attachment.id}
            className="flex items-center gap-3 p-2 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800/70 transition-colors"
          >
            <span className="text-2xl">{getFileIcon(attachment.mime_type)}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {attachment.file_name}
              </div>
              <div className="text-xs text-gray-400">
                {formatFileSize(attachment.file_size)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownload(attachment.id, attachment.file_name)}
                disabled={isDownloading || isDeleting}
                className="px-3 py-1.5 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/50 rounded hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Download"
              >
                {isDownloading ? '...' : '⬇️'}
              </button>
              {canDelete && (
                <button
                  onClick={() => handleDelete(attachment.id)}
                  disabled={isDownloading || isDeleting}
                  className="px-3 py-1.5 text-xs bg-red-500/20 text-red-400 border border-red-500/50 rounded hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Delete"
                >
                  {isDeleting ? '...' : '🗑️'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

