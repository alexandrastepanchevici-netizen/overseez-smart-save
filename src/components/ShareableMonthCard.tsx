import React from 'react';

interface Props {
  monthLabel: string;
  totalSaved: string;   // pre-formatted, e.g. "$42.50"
  activeDays: number;
  savesLogged: number;
  topStore: string;
}

/**
 * Off-screen card rendered solely for html2canvas capture.
 * Uses only inline styles so canvas rendering is accurate.
 */
const ShareableMonthCard = React.forwardRef<HTMLDivElement, Props>(
  ({ monthLabel, totalSaved, activeDays, savesLogged, topStore }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '360px',
          background: '#0f172a',
          borderRadius: '20px',
          padding: '28px 24px 24px',
          fontFamily: "'Inter', 'system-ui', sans-serif",
          color: '#f8fafc',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}
          >
            📊
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8' }}>
              Monthly Report Card
            </p>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>{monthLabel}</p>
          </div>
        </div>

        {/* Big savings number */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#64748b' }}>Total saved</p>
          <p style={{ margin: 0, fontSize: '48px', fontWeight: 800, letterSpacing: '-0.02em', color: '#34d399' }}>
            {totalSaved}
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <StatBox label="Active Days" value={String(activeDays)} />
          <StatBox label="Saves Logged" value={String(savesLogged)} />
          <StatBox label="Top Store" value={topStore} small />
        </div>

        {/* Footer */}
        <p style={{ margin: '20px 0 0', fontSize: '11px', color: '#475569', textAlign: 'center' }}>
          overseez.co  ·  Find the best prices near you
        </p>
      </div>
    );
  }
);
ShareableMonthCard.displayName = 'ShareableMonthCard';
export default ShareableMonthCard;

function StatBox({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div
      style={{
        flex: 1,
        background: '#1e293b',
        borderRadius: '12px',
        padding: '12px 10px',
        textAlign: 'center',
        minWidth: 0,
      }}
    >
      <p
        style={{
          margin: '0 0 4px',
          fontSize: small ? '13px' : '22px',
          fontWeight: 700,
          color: '#f1f5f9',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </p>
      <p style={{ margin: 0, fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </p>
    </div>
  );
}
