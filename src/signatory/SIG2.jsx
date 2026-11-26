import { useState } from 'react';
import { fetchClearanceItem } from './signatoryApi.js';
import { termFromRecords } from '../services/clearanceDisplay.js';
import ProofPreview from './ProofPreview.jsx';

function QueueIcon({ children, label }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden={label ? undefined : true} aria-label={label} role={label ? "img" : undefined}>
      {children}
    </svg>
  );
}

export default function SIG2({ students, onUpdateStudent }) {
  const [search, setSearch] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('All Programs');
  const [selectedYear, setSelectedYear] = useState('All years');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [inspectingStudent, setInspectingStudent] = useState(null);
  const [proofLoading, setProofLoading] = useState(false);
  const [proofFailed, setProofFailed] = useState(false);
  const [proofError, setProofError] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [flaggingStudent, setFlaggingStudent] = useState(null);
  const [flagRemarks, setFlagRemarks] = useState('');
  const [flagAmountDue, setFlagAmountDue] = useState('');
  const [flagError, setFlagError] = useState('');

  const pageSize = 8;

  const openProof = (student) => {
    setInspectingStudent(student);
    setProofFailed(false);
    setProofError('');
    if (student.proofUrl || !student.itemId) {
      setProofLoading(false);
      return;
    }
    setProofLoading(true);
    fetchClearanceItem(student.itemId)
      .then((detail) => {
        setInspectingStudent((current) => (
          current && current.id === student.id
            ? {
                ...current,
                proofUrl: detail.proofUrl,
                proof: detail.proof || current.proof,
                proofNotes: current.proofNotes || detail.proofNotes,
                proofDetails: current.proofDetails || detail.proofDetails,
                note: current.note || detail.note,
                amountDue: current.amountDue || detail.amountDue,
              }
            : current
        ));
      })
      .catch(() => setProofError('The proof file could not be loaded.'))
      .finally(() => setProofLoading(false));
  };

  const openFlagModal = (student) => {
    setFlaggingStudent(student);
    setFlagRemarks(student.note || '');
    setFlagAmountDue(student.amountDue && Number(student.amountDue) > 0 ? student.amountDue : '');
    setFlagError('');
  };

  const closeFlagModal = () => {
    if (submittingAction) return;
    setFlaggingStudent(null);
    setFlagRemarks('');
    setFlagAmountDue('');
    setFlagError('');
  };

  const updateStudentStatus = async (id, newStatus, extra = {}) => {
    const student = students.find((item) => item.id === id);
    if (newStatus === 'Cleared' && student?.status === 'Deficiency' && !extra.fromProofReview) return false;
    setSubmittingAction(true);
    try {
      const ok = await onUpdateStudent(id, { status: newStatus, ...extra });
      if (ok !== false) {
        setInspectingStudent(null);
        return true;
      }
      return false;
    } finally {
      setSubmittingAction(false);
    }
  };

  const submitFlagDeficiency = async (event) => {
    event.preventDefault();
    if (!flaggingStudent || submittingAction) return;
    const remarks = flagRemarks.trim();
    if (!remarks) {
      setFlagError('Please enter a reason or remarks for the deficiency.');
      return;
    }
    const rawAmount = flagAmountDue.trim();
    if (rawAmount !== '') {
      const parsed = Number(rawAmount);
      if (!Number.isFinite(parsed) || parsed < 0) {
        setFlagError('Amount due must be a valid non-negative number.');
        return;
      }
    }
    setFlagError('');
    const ok = await updateStudentStatus(flaggingStudent.id, 'Deficiency', {
      note: remarks,
      amountDue: rawAmount === '' ? null : Number(rawAmount).toFixed(2),
    });
    if (ok !== false) {
      setFlaggingStudent(null);
      setFlagRemarks('');
      setFlagAmountDue('');
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = String(s.name || "").toLowerCase().includes(search.toLowerCase()) || String(s.id).includes(search);
    const matchesProgram = selectedProgram === 'All Programs' || String(s.program || "").includes(selectedProgram);
    const matchesYear = selectedYear === 'All years' || String(s.yearLevel) === selectedYear;
    const matchesStatus = selectedStatus === 'All' || s.status === selectedStatus;
    return matchesSearch && matchesProgram && matchesYear && matchesStatus;
  });
  const pageCount = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const activePage = Math.min(currentPage, pageCount);
  const firstRecord = filteredStudents.length === 0 ? 0 : (activePage - 1) * pageSize + 1;
  const lastRecord = Math.min(activePage * pageSize, filteredStudents.length);
  const paginatedStudents = filteredStudents.slice((activePage - 1) * pageSize, activePage * pageSize);

  return (
    <div className="signatory-approval-page" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.2rem' }}>
      
      {/* Left Sidebar Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <label style={{ fontSize: '0.68rem', fontWeight: '800', color: '#74806E', letterSpacing: '0.05em' }}>FIND STUDENT</label>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Name or Student ID"
            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #E2E7DC', fontSize: '0.8rem', margin: '0.4rem 0 1rem 0', boxSizing: 'border-box' }}
          />

          <label style={{ fontSize: '0.68rem', fontWeight: '800', color: '#74806E', letterSpacing: '0.05em' }}>ACADEMIC PROGRAM</label>
          <select
            value={selectedProgram}
            onChange={(e) => {
              setSelectedProgram(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #E2E7DC', fontSize: '0.8rem', margin: '0.4rem 0 1rem 0', boxSizing: 'border-box', backgroundColor: '#F6F8F4' }}
          >
            <option>All Programs</option>
            <option>BSIT</option>
            <option>BSIS</option>

          </select>

          <label style={{ fontSize: '0.68rem', fontWeight: '800', color: '#74806E', letterSpacing: '0.05em' }}>YEAR</label>
          <select
            aria-label="Filter by year"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setCurrentPage(1);
            }}
            style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '10px', border: '1px solid #E2E7DC', fontSize: '0.8rem', margin: '0.4rem 0 1rem 0', boxSizing: 'border-box', backgroundColor: '#F6F8F4' }}
          >
            <option>All years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          <label style={{ fontSize: '0.68rem', fontWeight: '800', color: '#74806E', letterSpacing: '0.05em' }}>STATUS</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.4rem' }}>
            {[
              { id: 'All', label: 'All status', count: students.length },
              { id: 'Pending', label: 'Pending', count: students.filter((student) => student.status === 'Pending').length },
              { id: 'Under Review', label: 'Under Review', count: students.filter((student) => student.status === 'Under Review').length },
              { id: 'Deficiency', label: 'Deficiency', count: students.filter((student) => student.status === 'Deficiency').length },
              { id: 'Cleared', label: 'Cleared', count: students.filter((student) => student.status === 'Cleared').length },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setSelectedStatus(st.id);
                  setCurrentPage(1);
                }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.5rem 0.8rem',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: selectedStatus === st.id ? '#2E3D28' : 'transparent',
                  color: selectedStatus === st.id ? '#FFF' : '#29352A',
                  fontSize: '0.8rem',
                  fontWeight: selectedStatus === st.id ? '700' : '500',
                  cursor: 'pointer'
                }}
              >
                <span>{st.label}</span>
                <span style={{ opacity: 0.7 }}>{st.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stage Requirement Card */}
        <div style={{ backgroundColor: '#2E3D28', color: '#FFF', borderRadius: '20px', padding: '1.2rem' }}>
          <small style={{ color: '#B6C798', fontSize: '0.65rem' }}>YOUR STAGE</small>
          <h4 style={{ margin: '0.3rem 0 0.6rem 0', fontSize: '0.95rem' }}>
            {students[0] ? `Step ${students[0].orderSequence || '—'} - ${students[0].req}` : 'Assigned requirement'}
          </h4>
          <p style={{ fontSize: '0.75rem', color: '#DCE5D2', margin: 0, lineHeight: 1.4 }}>
            Steps are cleared in strict order. Students waiting on an earlier step show a locked Approve button.
          </p>
        </div>

      </div>

      {/* Right Table Panel */}
      <div className="signatory-approval-panel" style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#29352A' }}>Clearance Approval Queue</h3>
            <span style={{ fontSize: '0.75rem', color: '#74806E' }}>{termFromRecords(students) || "Student clearance"}</span>
          </div>
          <span style={{ backgroundColor: '#EDF1E8', color: '#29352A', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
            {filteredStudents.length} student records
          </span>
        </div>

        <div className="signatory-table-scroll">
        <table className="signatory-table signatory-approval-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ color: '#74806E', borderBottom: '2px solid #EDF1E8', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 0' }}>STUDENT</th>
              <th>REQUIREMENT</th>
              <th>STATUS</th>
              <th>DEFICIENCY SUMMARY</th>
              <th>PROOF</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.map((st) => (
              <tr key={st.id} style={{ borderBottom: '1px solid #F6F8F4' }}>
                
                {/* Student Info */}
                <td style={{ padding: '0.85rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#91A778', color: '#FFF', display: 'grid', placeItems: 'center', fontWeight: 'bold', fontSize: '0.75rem' }}>
                      {st.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', color: '#29352A' }}>{st.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#74806E' }}>{st.studentNumber || '—'} · {st.program || '—'}</div>
                    </div>
                  </div>
                </td>

                {/* Requirement */}
                <td>
                  <div style={{ fontWeight: '600' }}>{st.req}</div>
                  <div style={{ fontSize: '0.7rem', color: '#74806E' }}>Step {st.orderSequence || '—'} of 6</div>
                  {st.note && <div style={{ fontSize: '0.68rem', color: '#A77218' }}>{st.note}</div>}
                </td>

                {/* Status Badge */}
                <td>
                  <span style={{
                    backgroundColor: st.status === 'Cleared' ? '#E5F3E8' : st.status === 'Deficiency' ? '#FAE8E5' : st.status === 'Under Review' ? '#E2F1F7' : '#FFF3DC',
                    color: st.status === 'Cleared' ? '#458469' : st.status === 'Deficiency' ? '#AA5757' : st.status === 'Under Review' ? '#3E7E9C' : '#A77218',
                    padding: '0.25rem 0.6rem',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: '800'
                  }}>
                    {st.status}
                  </span>
                </td>

                {/* Deficiency Summary */}
                <td>
                  {st.fee !== '—' ? (
                    <div>
                      <div style={{ fontWeight: '700', color: '#AA5757' }}>{st.fee}</div>
                      <div style={{ fontSize: '0.7rem', color: '#74806E' }}>{st.proofDetails}</div>
                    </div>
                  ) : (
                    <span style={{ color: '#929B8C' }}>—</span>
                  )}
                </td>

                {/* Proof Icon */}
                <td>
                  {st.proof ? (
                    <button type="button" aria-label={`View proof for ${st.name}`} onClick={() => openProof(st)} style={{ backgroundColor: '#E2F1F7', color: '#3E7E9C', border: 'none', borderRadius: '8px', width: 32, height: 32, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                      <QueueIcon label="Proof">
                        <rect x="3" y="5" width="18" height="14" rx="2" />
                        <circle cx="8.5" cy="10" r="1.5" />
                        <path d="M21 16l-5-5L5 19" />
                      </QueueIcon>
                    </button>
                  ) : (
                    <span style={{ color: '#929B8C' }}>—</span>
                  )}
                </td>

                {/* Action Controls */}
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      disabled={st.status === 'Cleared' || st.status === 'Deficiency' || st.isActionable === false}
                      title={st.isActionable === false ? (st.blockingOffice ? `Waiting for ${st.blockingOffice}` : 'Waiting for an earlier step to be cleared') : undefined}
                      onClick={() => updateStudentStatus(st.id, 'Cleared')}
                      style={{
                        backgroundColor: st.status === 'Cleared' || st.status === 'Deficiency' || st.isActionable === false ? '#E2E7DC' : '#2E3D28',
                        color: st.status === 'Cleared' || st.status === 'Deficiency' || st.isActionable === false ? '#74806E' : '#FFF',
                        border: 'none',
                        padding: '0.35rem 0.7rem',
                        borderRadius: '14px',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        cursor: st.status === 'Cleared' || st.status === 'Deficiency' || st.isActionable === false ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <QueueIcon>
                        <path d="M20 6L9 17l-5-5" />
                      </QueueIcon>
                      {st.status === 'Cleared' ? 'Cleared' : st.status === 'Deficiency' || st.isActionable === false ? 'Locked' : 'Approve'}
                    </button>

                    <button
                      type="button"
                      disabled={st.status === 'Cleared'}
                      onClick={() => openFlagModal(st)}
                      style={{
                        backgroundColor: '#FFF',
                        color: '#AA5757',
                        border: '1px solid #AA5757',
                        padding: '0.35rem 0.7rem',
                        borderRadius: '14px',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        cursor: st.status === 'Cleared' ? 'not-allowed' : 'pointer',
                        opacity: st.status === 'Cleared' ? 0.5 : 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <QueueIcon>
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                        <line x1="4" y1="22" x2="4" y2="15" />
                      </QueueIcon>
                      Flag
                    </button>

                    <button
                      type="button"
                      onClick={() => openProof(st)}
                      style={{
                        backgroundColor: '#EDF1E8',
                        color: '#29352A',
                        border: 'none',
                        padding: '0.35rem 0.7rem',
                        borderRadius: '14px',
                        fontWeight: '700',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem'
                      }}
                    >
                      <QueueIcon>
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </QueueIcon>
                      Inspect
                    </button>
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {/* Pagination Footer */}
        <div className="signatory-queue-pagination" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.2rem', fontSize: '0.78rem', color: '#74806E' }}>
          <span>Showing {firstRecord}–{lastRecord} of {filteredStudents.length} records</span>
          <nav aria-label="Approval queue pagination" style={{ display: 'flex', gap: '0.3rem' }}>
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
                cursor: activePage === 1 ? 'not-allowed' : 'pointer'
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
                  cursor: 'pointer'
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
                cursor: activePage === pageCount ? 'not-allowed' : 'pointer'
              }}
            >
              ›
            </button>
          </nav>
        </div>

      </div>

      <ProofPreview
        key={inspectingStudent?.id ?? 'none'}
        student={inspectingStudent}
        loading={proofLoading}
        error={proofError}
        failed={proofFailed}
        submitting={submittingAction}
        onImageError={() => setProofFailed(true)}
        onClose={() => setInspectingStudent(null)}
        onApprove={inspectingStudent ? () => updateStudentStatus(inspectingStudent.id, 'Cleared', { fromProofReview: inspectingStudent.status === 'Under Review' }) : undefined}
        onReject={inspectingStudent ? (reason) => updateStudentStatus(inspectingStudent.id, 'Deficiency', { note: reason, rejectProof: true }) : undefined}
        approveDisabled={!inspectingStudent || inspectingStudent.status === 'Deficiency' || inspectingStudent.status === 'Cleared' || inspectingStudent.isActionable === false}
      />

      {flaggingStudent && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 1000,
          }}
          onClick={closeFlagModal}
        >
          <div
            className="signatory-modal"
            onClick={(event) => event.stopPropagation()}
            style={{ backgroundColor: '#FFF', borderRadius: '20px', padding: '1.5rem', width: 'min(460px, calc(100vw - 2rem))', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
          >
            <h3 style={{ margin: '0 0 0.35rem 0', color: '#29352A' }}>Flag Deficiency</h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.84rem', color: '#74806E' }}>
              {flaggingStudent.name} ({flaggingStudent.studentNumber || 'No student ID'}) · {flaggingStudent.req}
            </p>
            <form onSubmit={submitFlagDeficiency} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label htmlFor="flag-remarks" style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#74806E', marginBottom: '0.35rem' }}>
                  REASON / REMARKS (REQUIRED)
                </label>
                <textarea
                  id="flag-remarks"
                  rows={3}
                  value={flagRemarks}
                  onChange={(event) => setFlagRemarks(event.target.value)}
                  placeholder="e.g., Overdue book penalty: Database System Concepts"
                  style={{ width: '100%', padding: '0.65rem 0.75rem', borderRadius: '10px', border: '1px solid #E2E7DC', fontSize: '0.84rem', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>
              <div>
                <label htmlFor="flag-amount-due" style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#74806E', marginBottom: '0.35rem' }}>
                  AMOUNT DUE IN PHP (OPTIONAL)
                </label>
                <input
                  id="flag-amount-due"
                  type="number"
                  step="0.01"
                  min="0"
                  value={flagAmountDue}
                  onChange={(event) => setFlagAmountDue(event.target.value)}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '10px', border: '1px solid #E2E7DC', fontSize: '0.84rem', boxSizing: 'border-box' }}
                />
              </div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#74806E', backgroundColor: '#F6F8F4', padding: '0.65rem 0.75rem', borderRadius: '10px' }}>
                Flagging a deficiency sends an automated notice to the student and places this requirement on hold until resolved.
              </p>
              {flagError && <div role="alert" style={{ color: '#AA5757', fontSize: '0.78rem', fontWeight: 600 }}>{flagError}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={closeFlagModal}
                  disabled={submittingAction}
                  style={{ border: 'none', backgroundColor: '#EDF1E8', color: '#29352A', padding: '0.55rem 1rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  style={{ border: 'none', backgroundColor: '#AA5757', color: '#FFF', padding: '0.55rem 1.1rem', borderRadius: '10px', fontWeight: 700, cursor: submittingAction ? 'wait' : 'pointer' }}
                >
                  {submittingAction ? 'Saving…' : 'Confirm Deficiency'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}