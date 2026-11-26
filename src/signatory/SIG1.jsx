import { useEffect, useState } from 'react';
import statusApproved from '../assets/status-approved.svg';
import { termFromRecords } from '../services/clearanceDisplay.js';

export default function SIG1({ profile, students, metrics, onUpdateStudent, onNavigateToQueue }) {
  const queue = students.map((student) => ({
    ...student,
    course: student.program,
    status: student.status === 'Cleared' ? 'Approved' : student.status,
    statusColor: student.status === 'Cleared' ? '#E5F3E8' : student.status === 'Deficiency' ? '#FAE8E5' : student.status === 'Under Review' ? '#E2F1F7' : '#FFF3DC',
    textColor: student.status === 'Cleared' ? '#458469' : student.status === 'Deficiency' ? '#AA5757' : student.status === 'Under Review' ? '#3E7E9C' : '#A77218',
  }));
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [currentPage, setCurrentPage] = useState(1);

  const [activity, setActivity] = useState([]);
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(queue.length / pageSize));
  const activePage = Math.min(currentPage, pageCount);
  const firstRecord = queue.length === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const lastRecord = Math.min(activePage * pageSize, queue.length);
  const paginatedQueue = queue.slice((activePage - 1) * pageSize, activePage * pageSize);
  const approvedCount = metrics ? metrics.cleared : queue.filter((student) => student.status === 'Approved').length;
  const pendingCount = metrics
    ? metrics.pending + metrics.underReview
    : queue.filter((student) => student.status === 'Pending' || student.status === 'Under Review').length;
  const activeDeficiencies = metrics
    ? metrics.deficiency
    : queue.filter((student) => student.status === 'Deficiency').length;
  const pendingSettlementProofs = queue.filter((student) => student.proofStatus === 'submitted').length;
  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    const timerId = window.setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => window.clearInterval(timerId);
  }, []);

  const handleApprove = (studentId) => {
    const student = queue.find((item) => item.id === studentId);
    if (!student || student.status === 'Approved' || student.isActionable === false) return;

    onUpdateStudent(studentId, { status: 'Cleared' });
    setActivity((current) => [
      {
        id: `${studentId}-${Date.now()}`,
        color: '#458469',
        title: `Signed off ${student.name}`,
        sub: 'Program Chair Approval · Just now',
      },
      ...current,
    ]);
  };

  return (
    <div className="signatory-dashboard" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.2rem' }}>
      
      {/* Left Column: Metric Cards & Queue */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        
        {/* Top 4 Stat Grid */}
        <div className="signatory-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          
          <StatCard
            title="Pending Reviews"
            value={pendingCount}
            sub="Waiting on this office"
            accent="#A77218"
            icon="⏱️"
          />

          <StatCard
            title="Active Deficiencies"
            value={activeDeficiencies}
            sub="Awaiting resolution"
            accent="#AA5757"
            icon="⚠️"
          />

          <StatCard
            title="Pending Settlement Proofs"
            value={pendingSettlementProofs}
            sub="Awaiting receipt verification"
            accent="#3E7E9C"
            icon="📄"
          />

          <StatCard
            title="Total Approved"
            value={approvedCount}
            sub={`of ${students.length} assigned students`}
            accent="#458469"
            image={statusApproved}
          />

        </div>

        {/* Next in Your Queue Table */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#29352A' }}>Next in Your Queue</h3>
            <button
              onClick={onNavigateToQueue}
              style={{ background: 'none', border: 'none', color: '#51664C', fontWeight: 'bold', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              View full Approval Queue →
            </button>
          </div>

          <div className="signatory-table-scroll">
          <table className="signatory-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ color: '#74806E', borderBottom: '1px solid #EDF1E8', textAlign: 'left' }}>
                <th style={{ padding: '0.6rem 0' }}>STUDENT</th>
                <th>REQUIREMENT</th>
                <th>STATUS</th>
                <th style={{ textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {paginatedQueue.map((student) => (
                <tr key={student.id} style={{ borderBottom: '1px solid #F6F8F4' }}>
                  <td style={{ padding: '0.85rem 0' }}>
                    <div style={{ fontWeight: '700', color: '#29352A' }}>{student.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#74806E' }}>{student.studentNumber || '—'} · {student.course || '—'}</div>
                  </td>
                  <td style={{ color: '#51664C', fontWeight: '500' }}>{student.req}</td>
                  <td>
                    <span style={{
                      backgroundColor: student.statusColor,
                      color: student.textColor,
                      padding: '0.25rem 0.65rem',
                      borderRadius: '12px',
                      fontSize: '0.72rem',
                      fontWeight: '800'
                    }}>
                      {student.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {student.status === 'Approved' ? (
                      <span style={{ color: '#458469', fontWeight: 'bold', fontSize: '0.78rem' }}>✓ Cleared</span>
                    ) : student.status === 'Deficiency' ? (
                      <span style={{ color: '#74806E', fontSize: '0.78rem' }}>Awaiting proof</span>
                    ) : (
                      <button
                        onClick={() => handleApprove(student.id)}
                        disabled={student.isActionable === false}
                        title={student.isActionable === false ? (student.blockingOffice ? `Waiting for ${student.blockingOffice}` : 'Waiting for an earlier step to be cleared') : undefined}
                        style={{
                          backgroundColor: student.isActionable === false ? '#E2E7DC' : '#2E3D28',
                          color: student.isActionable === false ? '#74806E' : '#FFF',
                          border: 'none',
                          padding: '0.45rem 1rem',
                          borderRadius: '20px',
                          fontWeight: '700',
                          fontSize: '0.75rem',
                          cursor: student.isActionable === false ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {student.isActionable === false ? 'Locked' : 'Approve'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="signatory-pagination-mobile" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem', fontSize: '0.78rem', color: '#74806E' }}>
            <span>Showing {firstRecord}–{lastRecord} of {queue.length} records</span>
            <nav aria-label="Queue pagination" style={{ display: 'flex', gap: '0.3rem' }}>
              <button
                type="button"
                aria-label="Previous page"
                disabled={activePage === 1}
                onClick={() => setCurrentPage(activePage - 1)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#EDF1E8',
                  color: activePage === 1 ? '#929B8C' : '#29352A',
                  cursor: activePage === 1 ? 'not-allowed' : 'pointer',
                }}
              >
                ‹
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={
                    page === 1 ||
                    page === pageCount ||
                    page === activePage ||
                    page === activePage - 1 ||
                    page === activePage + 1
                      ? 'signatory-page-mobile-visible'
                      : 'signatory-page-mobile-hide'
                  }
                  aria-current={activePage === page ? 'page' : undefined}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: activePage === page ? '#2E3D28' : '#EDF1E8',
                    color: activePage === page ? '#FFF' : '#29352A',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                aria-label="Next page"
                disabled={activePage === pageCount}
                onClick={() => setCurrentPage(activePage + 1)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#EDF1E8',
                  color: activePage === pageCount ? '#929B8C' : '#29352A',
                  cursor: activePage === pageCount ? 'not-allowed' : 'pointer',
                }}
              >
                ›
              </button>
            </nav>
          </div>
        </div>

      </div>

      {/* Right Column: Greeting & Activity Stream */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        
        {/* Welcome Banner */}
        <div style={{ backgroundColor: '#2E3D28', color: '#FFF', borderRadius: '20px', padding: '1.2rem', height: '9rem' }}>
          <div style={{ fontSize: '0.65rem', color: '#B6C798', letterSpacing: '0.05em', fontWeight: '800' }}>
            {termFromRecords(students) || "Student clearance"}
          </div>
          <h2 style={{ fontSize: '0.9rem', margin: '0.2rem 0', letterSpacing: '-0.02em' }}>
            {greeting}, {profile.displayName || `${profile.title ?? ""} ${profile.lastName ?? ""}`.trim()}
          </h2>
          <p style={{ fontSize: '0.68rem', color: '#DCE5D2', margin: '0 0 0.4rem 0' }}>
            You have {pendingCount} students waiting at {students[0]?.req || 'this step'}.
          </p>
          <button
            onClick={onNavigateToQueue}
            style={{
              backgroundColor: '#A9B887',
              color: '#2E3D28',
              border: 'none',
              padding: '0.3rem 0.6rem',
              borderRadius: '20px',
              fontSize: '0.65rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Go to Approval Queue →
          </button>
        </div>

        {/* Activity Stream */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', padding: '1.5rem', flex: 1, boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#29352A' }}>Activity Stream</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activity.length === 0 ? (
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#74806E' }}>
                No recent activity.
              </p>
            ) : (
              activity.map((item) => (
                <ActivityItem key={item.id} color={item.color} title={item.title} sub={item.sub} />
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

function StatCard({ title, value, sub, accent, icon, image }) {
  return (
    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.2rem', position: 'relative', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', borderLeft: `5px solid ${accent}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#74806E', fontWeight: '700' }}>
        <span>{title}</span>
        <span>{image ? <img src={image} alt="" aria-hidden="true" style={{ width: 18, height: 18 }} /> : icon}</span>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: '800', color: '#29352A', margin: '0.4rem 0 0.1rem 0' }}>{value}</div>
      <div style={{ fontSize: '0.72rem', color: accent, fontWeight: '700' }}>{sub}</div>
    </div>
  );
}

function ActivityItem({ color, title, sub }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, marginTop: '5px', flexShrink: 0 }} />
      <div>
        <div style={{ fontWeight: '700', color: '#29352A' }}>{title}</div>
        <div style={{ fontSize: '0.72rem', color: '#74806E' }}>{sub}</div>
      </div>
    </div>
  );
}