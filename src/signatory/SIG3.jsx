import { useState } from 'react';
import ProofPreview from './ProofPreview.jsx';
import { fetchClearanceItem } from './signatoryApi.js';
import { termFromRecords } from '../services/clearanceDisplay.js';

export default function SIG3({ students, onUpdateStudent }) {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [inspectingStudent, setInspectingStudent] = useState(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [proofFailed, setProofFailed] = useState(false);
  const [proofError, setProofError] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('All Programs');
  const [selectedYear, setSelectedYear] = useState('All years');
  const [expandedColumns, setExpandedColumns] = useState({});
  const searchTerm = search.trim().toLowerCase();
  const filteredStudents = students.filter((student) => {
    const matchesSearch = !searchTerm
      || String(student.name || "").toLowerCase().includes(searchTerm)
      || String(student.studentNumber || "").toLowerCase().includes(searchTerm)
      || String(student.id || "").toLowerCase().includes(searchTerm);
    const matchesProgram = selectedProgram === 'All Programs'
      || student.program === selectedProgram;
    const matchesYear = selectedYear === 'All years' || String(student.yearLevel) === selectedYear;
    return matchesSearch && matchesProgram && matchesYear;
  });
  const awaitingList = filteredStudents.filter(
    (student) => student.status === 'Deficiency' && student.proofStatus !== 'submitted' && student.proofStatus !== 'resolved',
  );
  const readyList = filteredStudents.filter((student) => student.proofStatus === 'submitted');
  const resolvedList = filteredStudents.filter((student) => student.proofStatus === 'resolved');

  const toggleColumn = (column) => {
    setExpandedColumns((current) => ({ ...current, [column]: !current[column] }));
  };

  const openProof = (item) => {
    setInspectingStudent(item);
    setProofFailed(false);
    setProofError('');
    if (item.proofUrl || !item.itemId) {
      setProofLoading(false);
      return;
    }
    setProofLoading(true);
    fetchClearanceItem(item.itemId)
      .then((detail) => {
        setInspectingStudent((current) => (
          current && current.id === item.id
            ? {
                ...current,
                proofUrl: detail.proofUrl,
                proof: detail.proof || current.proof,
                proofNotes: current.proofNotes || detail.proofNotes,
                proofDetails: current.proofDetails || detail.proofDetails,
                note: current.note || detail.note,
              }
            : current
        ));
      })
      .catch(() => setProofError('The proof file could not be loaded.'))
      .finally(() => setProofLoading(false));
  };

  const approveInspected = async () => {
    if (!inspectingStudent || inspectingStudent.status === 'Cleared' || inspectingStudent.isActionable === false || submittingProof) return false;
    setSubmittingProof(true);
    try {
      const ok = await onUpdateStudent(inspectingStudent.id, { status: 'Cleared' });
      if (ok !== false) setInspectingStudent(null);
      return ok;
    } finally {
      setSubmittingProof(false);
    }
  };

  const rejectInspected = async (reason) => {
    if (!inspectingStudent || inspectingStudent.status === 'Cleared' || submittingProof) return false;
    setSubmittingProof(true);
    try {
      const ok = await onUpdateStudent(inspectingStudent.id, {
        status: 'Deficiency',
        note: reason,
        rejectProof: true,
      });
      if (ok !== false) setInspectingStudent(null);
      return ok;
    } finally {
      setSubmittingProof(false);
    }
  };

  return (
    <div className="signatory-deficiencies-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      
      {/* Top Title & Header Metrics Bar */}
      <div className="signatory-deficiencies-header" style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '0.85rem 1.2rem', display: 'grid', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#29352A' }}>Deficiencies & Proofs</h2>
          <span style={{ fontSize: '0.78rem', color: '#74806E' }}>Items needing settlement review{termFromRecords(students) ? ` • ${termFromRecords(students)}` : ""}</span>
        </div>
        <div className="signatory-metrics-grid" style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem' }}>
          <HeaderPill count={awaitingList.length} label="Active Deficiencies" accent="#AA5757" />
          <HeaderPill count={readyList.length} label="Pending Settlement Proofs" accent="#3E7E9C" />
          <HeaderPill count={resolvedList.length} label="Resolved This Week" accent="#458469" />
        </div>
        <div className="signatory-deficiencies-controls" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <input
            type="search"
            aria-label="Search by student name or ID"
            placeholder="Name or Student ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ width: '180px', maxWidth: '100%', padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #E2E7DC', fontSize: '0.8rem', boxSizing: 'border-box', backgroundColor: '#F6F8F4' }}
          />
          <select
            aria-label="Filter by academic program"
            value={selectedProgram}
            onChange={(event) => setSelectedProgram(event.target.value)}
            style={{ width: '120px', maxWidth: '100%', padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #E2E7DC', fontSize: '0.8rem', boxSizing: 'border-box', backgroundColor: '#F6F8F4' }}
          >
            <option>All Programs</option>
            <option>BSIT</option>
            <option>BSIS</option>
          </select>
          <select
            aria-label="Filter by year"
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            style={{ width: '120px', maxWidth: '100%', padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #E2E7DC', fontSize: '0.8rem', boxSizing: 'border-box', backgroundColor: '#F6F8F4' }}
          >
            <option>All years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
        </div>
      </div>

      {/* 3 Column Kanban Board */}
      <div className="signatory-kanban-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.2rem' }}>
        
        {/* Col 1: Awaiting Settlement */}
        <KanbanCol
          title="Awaiting Settlement"
          sub="Flagged - student has not submitted proof"
          badge={awaitingList.length}
          color="#AA5757"
          footer={awaitingList.length > 3 && (
            <button type="button" onClick={() => toggleColumn('awaiting')} aria-expanded={Boolean(expandedColumns.awaiting)} style={{ alignSelf: 'center', background: 'none', border: 'none', color: '#2E3D28', padding: '0.4rem', fontWeight: 'bold', cursor: 'pointer' }}>
              {expandedColumns.awaiting ? 'Show less' : 'View all'}
            </button>
          )}
        >
          {(expandedColumns.awaiting ? awaitingList : awaitingList.slice(0, 3)).map((item) => (
            <div key={item.id} style={{ backgroundColor: '#F5F6EF', border: '1px solid #E2E7DC', borderRadius: '14px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Avatar name={item.name} color="#91A778" />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#74806E' }}>{item.studentNumber || '—'} · {item.program || '—'}</div>
                  </div>
                </div>
                <span style={{ backgroundColor: '#FAE8E5', color: '#AA5757', padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 'bold', height: 'fit-content' }}>deficiency</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', margin: '0.7rem 0', fontSize: '0.78rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#74806E', fontSize: '0.68rem' }}>REASON</div>
                  <div>{item.proofDetails || item.note || 'Requirement needs attention'}</div>
                </div>
                <span style={{ fontWeight: '800', color: '#29352A', textAlign: 'right', whiteSpace: 'nowrap' }}>{item.fee}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: '#74806E' }}>Awaiting student proof</span>
              </div>
            </div>
          ))}
        </KanbanCol>

        {/* Col 2: Ready for Review */}
        <KanbanCol
          title="Ready for Review"
          sub="Proof uploaded - needs your verification"
          badge={readyList.length}
          color="#3E7E9C"
          footer={readyList.length > 3 && (
            <button type="button" onClick={() => toggleColumn('ready')} aria-expanded={Boolean(expandedColumns.ready)} style={{ alignSelf: 'center', background: 'none', border: 'none', color: '#2E3D28', padding: '0.4rem', fontWeight: 'bold', cursor: 'pointer' }}>
              {expandedColumns.ready ? 'Show less' : 'View all'}
            </button>
          )}
        >
          {(expandedColumns.ready ? readyList : readyList.slice(0, 3)).map((item) => (
            <div key={item.id} style={{ backgroundColor: '#F5F6EF', border: '1px solid #E2E7DC', borderRadius: '14px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Avatar name={item.name} color="#91A778" />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#74806E' }}>{item.studentNumber || '—'} · {item.program || '—'}</div>
                  </div>
                </div>
                <span style={{ backgroundColor: '#E2F1F7', color: '#3E7E9C', padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 'bold', height: 'fit-content' }}>Under Review</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', margin: '0.7rem 0', fontSize: '0.78rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#74806E', fontSize: '0.68rem' }}>REASON</div>
                  <div>{item.proofDetails || item.note || 'Submitted proof is ready for review'}</div>
                </div>
                <span style={{ fontWeight: '800', color: '#29352A', textAlign: 'right', whiteSpace: 'nowrap' }}>{item.fee}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: '#74806E' }}>Proof submitted for review</span>
                <button
                  type="button"
                  onClick={() => openProof(item)}
                  style={{ backgroundColor: '#2E3D28', color: '#FFF', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Inspect Proof
                </button>
              </div>
            </div>
          ))}
        </KanbanCol>

        {/* Col 3: Recently Resolved */}
        <KanbanCol
          title="Recently Resolved"
          sub="Your latest proof decisions"
          badge={resolvedList.length}
          color="#458469"
          footer={resolvedList.length > 3 && (
            <button type="button" onClick={() => toggleColumn('resolved')} aria-expanded={Boolean(expandedColumns.resolved)} style={{ alignSelf: 'center', background: 'none', border: 'none', color: '#2E3D28', padding: '0.4rem', fontWeight: 'bold', cursor: 'pointer' }}>
              {expandedColumns.resolved ? 'Show less' : 'View all'}
            </button>
          )}
        >
          {(expandedColumns.resolved ? resolvedList : resolvedList.slice(0, 3)).map((item) => (
            <div key={item.id} style={{ backgroundColor: '#F5F6EF', border: '1px solid #E2E7DC', borderRadius: '14px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Avatar name={item.name} color="#91A778" />
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#74806E' }}>{item.studentNumber || '—'} · {item.program || '—'}</div>
                  </div>
                </div>
                <span style={{ backgroundColor: item.status === 'Cleared' ? '#E5F3E8' : '#FAE8E5', color: item.status === 'Cleared' ? '#458469' : '#AA5757', padding: '0.15rem 0.5rem', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 'bold', height: 'fit-content' }}>
                  {item.status}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', margin: '0.7rem 0', fontSize: '0.78rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#74806E', fontSize: '0.68rem' }}>DECISION</div>
                  <div>Proof approved · requirement marked as cleared</div>
                </div>
                <span style={{ fontWeight: '800', color: '#29352A', textAlign: 'right', whiteSpace: 'nowrap' }}>{item.resolvedAmount || item.fee}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.68rem', color: '#74806E' }}>Proof approved</span>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(item)}
                  style={{ backgroundColor: '#FFFFFF', color: '#29352A', border: '1px solid #C2CDBD', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  View Record
                </button>
              </div>
            </div>
          ))}
        </KanbanCol>

      </div>

      <ProofPreview
        key={inspectingStudent?.id ?? 'none'}
        student={inspectingStudent}
        loading={proofLoading}
        error={proofError}
        failed={proofFailed}
        submitting={submittingProof}
        onImageError={() => setProofFailed(true)}
        onClose={() => setInspectingStudent(null)}
        onApprove={approveInspected}
        onReject={rejectInspected}
        approveDisabled={!inspectingStudent || inspectingStudent.status === 'Cleared' || inspectingStudent.isActionable === false}
      />

      {selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
          <div className="signatory-modal" style={{ backgroundColor: '#FFF', borderRadius: '20px', padding: '1.5rem', width: 'min(420px, calc(100vw - 2rem))', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 0.5rem' }}>Resolved Clearance Record</h3>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#74806E' }}>
              {selectedRecord.name} ({selectedRecord.id})
            </p>
            <div style={{ backgroundColor: '#F6F8F4', padding: '1rem', borderRadius: '12px', margin: '1rem 0', fontSize: '0.82rem' }}>
              <div><strong>Program:</strong> {selectedRecord.program}</div>
              <div><strong>Status:</strong> {selectedRecord.status}</div>
              <div><strong>Decision:</strong> Proof approved</div>
              <div><strong>Previous amount:</strong> {selectedRecord.resolvedAmount || '—'}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                style={{ border: 'none', backgroundColor: '#EDF1E8', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function HeaderPill({ count, label, accent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', borderLeft: `4px solid ${accent}`, backgroundColor: '#F6F8F4', padding: '0.65rem 0.9rem', borderRadius: '12px', width: '180px' }}>
      <strong style={{ fontSize: '1.5rem', lineHeight: 1.1, color: '#29352A', flexShrink: 0 }}>{count}</strong>
      <span style={{ color: '#74806E', fontSize: '0.62rem', lineHeight: 1.1 }}>{label}</span>
    </div>
  );
}

function KanbanCol({ title, sub, badge, color, children, footer }) {
  return (
    <div style={{ backgroundColor: '#FFFFFF', borderTop: `4px solid ${color}`, borderRadius: '18px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
      <div style={{ paddingBottom: '0.45rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, color: '#29352A', fontSize: '0.95rem' }}>{title}</h4>
          <span style={{ backgroundColor: color, color: '#FFF', minWidth: 28, height: 24, padding: '0 0.4rem', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 'bold', display: 'grid', placeItems: 'center' }}>{badge}</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: '#74806E', marginTop: '0.25rem' }}>{sub}</div>
      </div>
      {children}
      {footer}
    </div>
  );
}

function Avatar({ name, color }) {
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: color, color: '#FFF', display: 'grid', placeItems: 'center', fontWeight: 'bold', fontSize: '0.7rem' }}>
      {name.split(' ').map(n=>n[0]).join('')}
    </div>
  );
}