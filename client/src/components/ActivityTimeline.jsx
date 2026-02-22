import { useState, useEffect, useCallback } from 'react';
import { logs as logsApi } from '../services/api';

const ACTION_ICONS = {
  created: '🏠',
  updated: '✏️',
  owner_added: '👤',
  owner_updated: '🔄',
  owner_removed: '❌',
};

const ACTION_COLORS = {
  created: 'var(--success)',
  updated: 'var(--accent)',
  owner_added: 'var(--success)',
  owner_updated: 'var(--warning)',
  owner_removed: 'var(--danger)',
};

function formatTimestamp(ts) {
  const d = new Date(ts);
  const date = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return { date, time };
}

export default function ActivityTimeline({ propertyId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const data = await logsApi.list(propertyId);
      setEntries(data);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (loading) {
    return (
      <div className="activity-timeline-section">
        <h2>Activity Log</h2>
        <div className="loading-screen"><div className="spinner" /> Loading...</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="activity-timeline-section">
        <h2>Activity Log</h2>
        <div className="empty-state"><p>No activity recorded yet.</p></div>
      </div>
    );
  }

  let lastDate = '';

  return (
    <div className="activity-timeline-section">
      <h2>Activity Log</h2>
      <div className="activity-timeline">
        {entries.map((entry) => {
          const { date, time } = formatTimestamp(entry.created_at);
          const showDate = date !== lastDate;
          lastDate = date;

          return (
            <div key={entry.id}>
              {showDate && <div className="activity-date-divider">{date}</div>}
              <div className="activity-item">
                <div
                  className="activity-dot"
                  style={{ background: ACTION_COLORS[entry.action] || 'var(--border)' }}
                />
                <div className="activity-content">
                  <span className="activity-icon">{ACTION_ICONS[entry.action] || '📝'}</span>
                  <span className="activity-desc">{entry.description}</span>
                  <span className="activity-time">{time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
