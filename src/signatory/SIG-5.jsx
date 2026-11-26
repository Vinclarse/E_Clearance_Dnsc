import { useState } from 'react';

export default function SIG5({ students, onUpdateStudent }) {
  const [filter, setFilter] = useState('All');
  const [year, setYear] = useState('All years');
  const [showAllRoster, setShowAllRoster] = useState(false);

  const roster = students.map((student) => ({
    ...student,
    course: student.program,
    status: student.steps.length > 0 && student.steps.every(Boolean)
      ? 'Completed'
      : student.status === 'Deficiency'
        ? 'Deficiency'
        : 'In Progress',
    clearedCount: student.steps.filter(Boolean).length,
  }));

  const validateEnrollment = (id) => {
    const student = students.find((item) => item.id === id);
    if (!student || student.validated || student.steps.length === 0 || !student.steps.every(Boolean)) return;
    onUpdateStudent(id, { validated: true });
  };

  const completedStudents = roster.filter((student) => student.status === 'Completed').length;
  const deficiencyStudents = roster.filter((student) => student.status === 'Deficiency').length;
  const inProgressStudents = roster.length - completedStudents - deficiencyStudents;
  const validatedStudents = roster.filter((student) => student.validated).length;
  const waitingForValidation = students.length - validatedStudents;
  const validatedRate = students.length === 0
    ? 0
    : Math.round((validatedStudents / students.length) * 100);
  const studentsPerStep = Array.from({ length: 6 }, (_, index) =>
    students.filter((student) => student.steps[index]).length,
  );
  const maxStudentsPerStep = Math.max(1, ...studentsPerStep);
  const bsitCount = students.filter((student) => /bsit/i.test(student.program)).length;
  const yearBreakdown = Array.from({ length: 4 }, (_, index) => {
    const yearLevel = index + 1;
    const suffix = yearLevel === 1 ? 'st' : yearLevel === 2 ? 'nd' : yearLevel === 3 ? 'rd' : 'th';
    return {
      label: `${yearLevel}${suffix} Year`,
      count: students.filter((student) => student.yearLevel === yearLevel).length,
    };
  });
  const stepLabels = ['1 - Library', '2 - Cashier', '3 - Adviser', '4 - Chair', '5 - Governor', '6 - Dean'];
  const completionBreakdown = [
    { label: 'Fully cleared', count: completedStudents, color: '#2E3D28' },
    { label: 'In progress', count: inProgressStudents, color: '#A9B887' },
    { label: 'With deficiency', count: deficiencyStudents, color: '#C34839' },
  ];
  const completionRate = roster.length === 0
    ? 0
    : Math.round((completedStudents / roster.length) * 100);
  const completionCircumference = 2 * Math.PI * 32;
  const filteredRoster = roster.filter((student) => (
    (filter === 'All' || student.status === filter)
    && (year === 'All years' || String(student.yearLevel) === year)
  ));
  const visibleRoster = showAllRoster ? filteredRoster : filteredRoster.slice(0, 3);

  return (
    <div className="signatory-cohort-page" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      
      {/* Visual Analytics Bar */}
      <div className="signatory-cohort-analytics" style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr 1.1fr 1.5fr', gap: '0.8rem' }}>
        
        {/* Department Stats */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '0.9rem', minWidth: 0 }}>
          <div style={{ fontSize: '0.62rem', color: '#74806E', fontWeight: 'bold' }}>TOTAL DEPARTMENT STUDENTS</div>
          <div style={{ fontSize: '2.2rem', lineHeight: 1.05, fontWeight: '800', color: '#29352A' }}>{students.length}</div>
          <div style={{ fontSize: '0.62rem', color: '#74806E', marginTop: '0.3rem' }}>BSIT: {bsitCount} Students Enrolled</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.3rem', marginTop: '0.65rem' }}>
            {yearBreakdown.map((year) => (
              <div key={year.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.25rem', backgroundColor: '#E8E9DF', borderRadius: '7px', padding: '0.3rem 0.45rem', color: '#74806E', fontSize: '0.55rem' }}>
                <span>{year.label}</span>
                <strong style={{ color: '#29352A' }}>{year.count}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Completion Gauge */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '0.9rem', minWidth: 0 }}>
          <div style={{ fontSize: '0.62rem', color: '#74806E', fontWeight: 'bold', marginBottom: '0.35rem' }}>COHORT CLEARANCE COMPLETION RATE</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '0.5rem' }}>
            <svg
              width="88"
              height="88"
              viewBox="0 0 90 90"
              role="img"
              aria-label={`${completionRate}% cohort completion`}
              style={{ flex: '0 0 auto' }}
            >
              <circle cx="45" cy="45" r="32" fill="none" stroke="#E2E7DC" strokeWidth="9" />
              {students.length > 0 && completionBreakdown.map((segment, index) => {
                const previousCount = completionBreakdown
                  .slice(0, index)
                  .reduce((total, item) => total + item.count, 0);
                return (
                  <circle
                    key={segment.label}
                    cx="45"
                    cy="45"
                    r="32"
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="9"
                    strokeDasharray={`${completionCircumference * segment.count / students.length} ${completionCircumference}`}
                    strokeDashoffset={-completionCircumference * previousCount / students.length}
                    transform="rotate(-90 45 45)"
                  />
                );
              })}
              <text x="45" y="43" textAnchor="middle" dominantBaseline="central" fill="#29352A" fontSize="18" fontWeight="800">
                {completionRate}%
              </text>
              <text x="45" y="57" textAnchor="middle" fill="#74806E" fontSize="6">
                completion
              </text>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', minWidth: 0 }}>
              {completionBreakdown.map((segment) => (
                <div key={segment.label} style={{ display: 'grid', gridTemplateColumns: '7px minmax(0, 1fr) auto', alignItems: 'center', gap: '0.35rem', fontSize: '0.58rem', color: '#74806E' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: segment.color }} />
                  <span>{segment.label}</span>
                  <strong style={{ color: '#29352A', fontSize: '0.62rem' }}>{segment.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enrollment Progress */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '0.9rem', minWidth: 0 }}>
          <div style={{ fontSize: '0.62rem', color: '#74806E', fontWeight: 'bold' }}>TERM ENROLLMENT PROGRESS</div>
          <div style={{ fontSize: '1.8rem', lineHeight: 1.1, fontWeight: '800', color: '#29352A' }}>
            {validatedStudents}
            <span style={{ fontSize: '0.78rem', color: '#74806E', fontWeight: 'normal' }}> / {students.length} validated</span>
          </div>
          <div style={{ height: '7px', backgroundColor: '#E8E9DF', borderRadius: '8px', overflow: 'hidden', marginTop: '0.35rem' }}>
            <div style={{ width: `${validatedRate}%`, height: '100%', backgroundColor: '#2E3D28', borderRadius: '8px' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.25rem', marginTop: '0.2rem', fontSize: '0.55rem', color: '#74806E' }}>
            <span>{validatedRate}% validated</span>
            <span>{waitingForValidation} waiting</span>
          </div>
          <div style={{ backgroundColor: '#E8ECDD', border: '1px solid #D3DCC9', borderRadius: '8px', padding: '0.45rem', marginTop: '0.55rem', fontSize: '0.55rem', lineHeight: 1.3, color: '#506047' }}>
            Next term: 2nd Semester, AY 2026–2027. Only fully cleared students can be validated.
          </div>
        </div>

        {/* Bar Chart Representation */}
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '0.9rem', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '0.62rem', color: '#74806E', fontWeight: 'bold', marginBottom: '0.3rem' }}>STUDENTS CLEARED PER STEP</div>
          <div style={{ display: 'flex', alignItems: 'stretch', justifyContent: 'space-between', gap: '0.25rem', height: '108px', marginTop: 'auto' }}>
            {studentsPerStep.map((count, index) => (
              <Bar
                key={index}
                h={count === 0 ? '0%' : `${Math.max(14, (count / maxStudentsPerStep) * 100)}%`}
                label={String(count)}
                stepLabel={stepLabels[index]}
                active={index === 3}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Roster & Sign-off Table */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        
        <div className="signatory-cohort-roster-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <h3 style={{ margin: 0, color: '#29352A', fontSize: '1.1rem' }}>Department Student Roster</h3>
          
          <div className="signatory-cohort-filters" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#EDF1E8', padding: '0.25rem', borderRadius: '30px' }}>
            <select
              aria-label="Filter by year"
              value={year}
              onChange={(event) => {
                setYear(event.target.value);
                setShowAllRoster(false);
              }}
              style={{ border: 'none', background: 'transparent', color: '#29352A', fontSize: '0.75rem', fontWeight: 700, padding: '0.35rem 0.6rem' }}
            >
              <option>All years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
            {['All', 'Completed', 'In Progress', 'Deficiency'].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setShowAllRoster(false);
                }}
                style={{
                  backgroundColor: filter === f ? '#2E3D28' : 'transparent',
                  color: filter === f ? '#FFF' : '#29352A',
                  border: 'none',
                  padding: '0.35rem 0.8rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                {f === 'All' ? 'All status' : f}
              </button>
            ))}
          </div>
        </div>

        <div className="signatory-table-scroll">
        <table className="signatory-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ color: '#74806E', borderBottom: '2px solid #EDF1E8', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 0' }}>STUDENT</th>
              <th>CLEARANCE PROGRESS (STEPS 1–6)</th>
              <th>OVERALL STATUS</th>
              <th style={{ textAlign: 'right' }}>ENROLLMENT VALIDATION</th>
            </tr>
          </thead>
          <tbody>
            {visibleRoster.map((st) => (
              <tr key={st.id} style={{ borderBottom: '1px solid #F6F8F4' }}>
                
                <td style={{ padding: '0.85rem 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: '#91A778', color: '#FFF', display: 'grid', placeItems: 'center', fontWeight: 'bold', fontSize: '0.75rem' }}>
                      {String(st.name || "").split(" ").map((part) => part[0]).join("")}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', color: '#29352A' }}>{st.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#74806E' }}>{st.studentNumber || '—'} · {st.course || '—'}</div>
                    </div>
                  </div>
                </td>

                {/* Steps Dots */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {st.steps.map((done, idx) => (
                      <span
                        key={idx}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: done ? '#458469' : '#EDF1E8',
                          color: done ? '#FFF' : '#74806E',
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          display: 'grid',
                          placeItems: 'center'
                        }}
                      >
                        {done ? '✓' : idx + 1}
                      </span>
                    ))}
                    <span style={{ fontSize: '0.75rem', color: '#74806E', marginLeft: '0.4rem' }}>{st.clearedCount}</span>
                  </div>
                </td>

                {/* Status Badge */}
                <td>
                  <span style={{
                    backgroundColor: st.status === 'Completed' ? '#E5F3E8' : st.status === 'Deficiency' ? '#FAE8E5' : '#FFF3DC',
                    color: st.status === 'Completed' ? '#458469' : st.status === 'Deficiency' ? '#AA5757' : '#A77218',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: '800'
                  }}>
                    {st.status}
                  </span>
                </td>

                {/* Validation Button Action */}
                <td style={{ textAlign: 'right' }}>
                  {st.status === 'Completed' && st.validated ? (
                    <span style={{ color: '#458469', fontWeight: '700', fontSize: '0.75rem' }}>Enrolled for next term</span>
                  ) : st.status === 'Completed' ? (
                    <button
                      type="button"
                      onClick={() => validateEnrollment(st.id)}
                      style={{
                        backgroundColor: '#51664C',
                        color: '#FFF',
                        border: 'none',
                        padding: '0.45rem 1rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer'
                      }}
                    >
                      Validate for Enrollment
                    </button>
                  ) : (
                    <button disabled style={{ backgroundColor: '#EDF1E8', color: '#74806E', border: 'none', padding: '0.45rem 1rem', borderRadius: '20px', fontSize: '0.75rem', cursor: 'not-allowed' }}>
                      Validate for Enrollment
                    </button>
                  )}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {filteredRoster.length > 3 && (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setShowAllRoster((showingAll) => !showingAll)}
              aria-expanded={showAllRoster}
              style={{ background: 'none', border: 'none', color: '#2E3D28', padding: '0.4rem', fontWeight: 'bold', cursor: 'pointer' }}
            >
              {showAllRoster ? 'Show less' : 'View all'}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

function Bar({ h, label, stepLabel, active }) {
  return (
    <div style={{ display: 'grid', gridTemplateRows: '12px 1fr 13px', rowGap: '3px', justifyItems: 'center', width: '15%', minWidth: 0 }}>
      <span style={{ fontSize: '0.58rem', fontWeight: '700', color: '#29352A' }}>{label}</span>
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end' }}>
        <div style={{ width: '100%', height: h, minHeight: h === '0%' ? 0 : '12px', backgroundColor: active ? '#2E3D28' : '#A9B887', borderRadius: '5px 5px 0 0' }} />
      </div>
      <span style={{ alignSelf: 'end', whiteSpace: 'nowrap', fontSize: '0.46rem', color: active ? '#29352A' : '#74806E', fontWeight: active ? '700' : 'normal' }}>
        {stepLabel}
      </span>
    </div>
  );
}