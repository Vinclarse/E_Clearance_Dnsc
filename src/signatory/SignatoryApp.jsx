import { useEffect, useState } from 'react'
import SignatoryLayout from './SignatoryLayout.jsx'
import SIG1 from './SIG1.jsx'
import SIG2 from './SIG2.jsx'
import SIG3 from './SIG3.jsx'
import SIG5 from './SIG-5.jsx'
import ProfileSection from '../components/ProfileSection.jsx'
import { fetchCurrentUser } from '../services/account.js'
import { signOut } from '../services/auth.js'
import {
  applySignatoryUpdate,
  fetchSignatoryNotifications,
  fetchSignatoryRecords,
  markAllNotificationsRead,
  markNotificationRead,
  metricsFromQueue,
  profileFromAccount,
  signatoryErrorMessage,
} from './signatoryApi.js'
import PortalLoading from '../components/PortalLoading.jsx'
import { subscribeAccount, subscribePortalRefresh } from '../services/portalRefresh.js'
import './signatory-responsive.css'

const emptyProfile = {
  firstName: 'Signatory',
  lastName: '',
  title: '',
  role: 'SIGNATORY',
  displayName: 'Signatory',
}

function initialSignatoryPage() {
  const path = window.location.pathname.replace(/\/+$/, '').toLowerCase()
  if (path === '/signatory/queue') return 'SIG2'
  if (path === '/signatory/deficiencies' || path === '/signatory/proofs') return 'SIG3'
  if (path === '/signatory/cohort' || path === '/signatory/cohort-dashboard') return 'SIG5'
  if (path === '/signatory/profile') return 'profile'
  return 'SIG1'
}

function isPastRecord(row) {
  return row.clearanceTypeIsActive === false || row.clearanceOverallStatus === 'completed' || row.status === 'Cleared'
}

export default function SignatoryApp() {
  const [activePage, setActivePage] = useState(initialSignatoryPage)
  const [clearanceScope, setClearanceScope] = useState('all')
  const [selectedCycleKey, setSelectedCycleKey] = useState('all')
  const [profile, setProfile] = useState(emptyProfile)
  const [notifications, setNotifications] = useState([])
  const [students, setStudents] = useState([])
  const [cohort, setCohort] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let isCurrent = true

    Promise.allSettled([
      fetchCurrentUser(),
      fetchSignatoryRecords(),
      fetchSignatoryNotifications(),
    ]).then(([account, records, notes]) => {
      if (!isCurrent) return
      if (account.status === 'fulfilled') setProfile(profileFromAccount(account.value))
      if (records.status === 'fulfilled') {
        setStudents(records.value.queue || [])
        setCohort(records.value.cohort || [])
        setMetrics(records.value.metrics || null)
        setLoadError('')
      } else {
        setLoadError(records.reason?.message || 'The signatory queue could not be loaded.')
      }
      if (notes.status === 'fulfilled') setNotifications(notes.value)
    }).finally(() => {
      if (isCurrent) setLoading(false)
    })

    return () => {
      isCurrent = false
    }
  }, [refreshKey])

  useEffect(() => subscribePortalRefresh(() => {
    setLoading(true)
    setRefreshKey((key) => key + 1)
  }), [])

  useEffect(() => subscribeAccount((account) => {
    if (account) setProfile(profileFromAccount(account))
  }), [])

  const addNotification = ({ title, desc }) => {
    setNotifications((current) => [
      {
        id: crypto.randomUUID(),
        title,
        desc,
        time: 'Just now',
        group: 'TODAY',
        unread: true,
      },
      ...current,
    ])
  }

  const markNotificationAsRead = (id) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, unread: false } : notification,
      ),
    )
    markNotificationRead(id).catch(() => {})
  }

  const markAllNotificationsAsRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, unread: false })),
    )
    markAllNotificationsRead().catch(() => {})
  }

  const updateStudent = async (id, updates) => {
    const student = students.find((item) => item.id === id) || cohort.find((item) => item.id === id)
    if (!student) return false

    setActionError('')
    const applyLocal = (row) => {
      if (String(row.id) !== String(id)) return row
      return {
        ...row,
        status: updates.status || row.status,
        note: typeof updates.note === 'string' ? updates.note : row.note,
        validated: updates.validated === true ? true : row.validated,
      }
    }

    try {
      await applySignatoryUpdate(student, updates)
      setStudents((rows) => rows.map(applyLocal))
      setCohort((rows) => rows.map(applyLocal))
    } catch (error) {
      const message = signatoryErrorMessage(error, 'The clearance record could not be updated.')
      setActionError(message)
      addNotification({
        title: 'Update was not saved',
        desc: message,
      })
      return false
    }

    try {
      const records = await fetchSignatoryRecords()
      setStudents(records.queue || [])
      setCohort(records.cohort || [])
      setMetrics(records.metrics || null)
    } catch (error) {
      const message = signatoryErrorMessage(error, 'The updated list could not be refreshed.')
      addNotification({
        title: 'Saved, but the list could not be refreshed',
        desc: message,
      })
    }

    let title = 'Clearance Record Updated'
    let desc = `${student.name}'s clearance record was updated.`
    if (updates.validated === true) {
      title = 'Enrollment Validated'
      desc = `${student.name}'s enrollment was validated.`
    } else if (updates.status === 'Cleared') {
      title = 'Clearance Approved'
      desc = `${student.name}'s clearance was approved.`
    } else if (updates.status === 'Deficiency') {
      title = updates.rejectProof ? 'Proof Rejected' : 'Deficiency Flagged'
      desc = updates.rejectProof
        ? `${student.name}'s submitted proof was rejected and returned to deficiency.`
        : `${student.name}'s clearance was flagged for a deficiency.`
    }

    addNotification({ title, desc })
    return true
  }

  const cycleMap = new Map()
  for (const row of [...students, ...cohort]) {
    if (!row?.clearanceCycleKey) continue
    if (!cycleMap.has(row.clearanceCycleKey)) {
      cycleMap.set(row.clearanceCycleKey, {
        key: row.clearanceCycleKey,
        label: row.clearanceCycleLabel || 'Semestral Clearance',
        isActive: row.clearanceTypeIsActive !== false,
      })
    }
  }
  const clearanceCycles = [...cycleMap.values()]

  const matchesScope = (row) => {
    if (selectedCycleKey !== 'all' && row.clearanceCycleKey !== selectedCycleKey) return false
    if (clearanceScope === 'active') return !isPastRecord(row)
    if (clearanceScope === 'past') return isPastRecord(row)
    return true
  }

  const isFiltered = clearanceScope !== 'all' || selectedCycleKey !== 'all'
  const visibleStudents = isFiltered ? students.filter(matchesScope) : students
  const visibleCohort = isFiltered ? cohort.filter(matchesScope) : cohort
  const visibleMetrics = isFiltered ? metricsFromQueue(visibleStudents) : metrics
  const showCycleFilterBar = activePage !== 'profile' && (clearanceCycles.length > 1 || students.some((row) => isPastRecord(row)))

  let page
  switch (activePage) {
    case 'SIG2':
      page = <SIG2 students={visibleStudents} onUpdateStudent={updateStudent} />
      break
    case 'SIG3':
      page = <SIG3 students={visibleStudents} onUpdateStudent={updateStudent} />
      break
    case 'SIG5':
      page = <SIG5 students={visibleCohort} onUpdateStudent={updateStudent} />
      break
    case 'profile':
      page = (
        <ProfileSection
          onAvatarUpdated={(url) => setProfile((current) => ({ ...current, avatarUrl: url }))}
        />
      )
      break
    case 'SIG1':
    default:
      page = (
        <SIG1
          profile={profile}
          students={visibleStudents}
          metrics={visibleMetrics}
          onUpdateStudent={updateStudent}
          onNavigateToQueue={() => setActivePage('SIG2')}
        />
      )
  }

  return (
    <SignatoryLayout
      activePage={activePage}
      onSelectPage={setActivePage}
      profile={profile}
      notifications={notifications}
      onMarkNotificationRead={markNotificationAsRead}
      onMarkAllNotificationsRead={markAllNotificationsAsRead}
      onSignOut={signOut}
      onOpenProfile={() => setActivePage('profile')}
    >
      {loading && activePage !== 'profile' ? (
        <PortalLoading variant="signatory" title="Loading the signatory portal" detail="Getting your queue and notifications." />
      ) : (
        <>
          {loadError && <p className="portal-loading-error" role="alert">{loadError}</p>}
          {actionError && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
                backgroundColor: '#FAE8E5',
                color: '#8C3333',
                border: '1px solid #E5B4B4',
                borderRadius: '14px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                fontSize: '0.84rem',
                fontWeight: '600',
              }}
            >
              <span>{actionError}</span>
              <button
                type="button"
                aria-label="Dismiss error"
                onClick={() => setActionError('')}
                style={{ background: 'none', border: 'none', color: '#8C3333', fontWeight: '800', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          )}
          {showCycleFilterBar && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                padding: '0.65rem 1rem',
                marginBottom: '1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <div role="group" aria-label="Filter by clearance status" style={{ display: 'inline-flex', gap: '0.25rem', backgroundColor: '#F3F5EE', padding: '0.22rem', borderRadius: '10px' }}>
                {[
                  { id: 'all', label: `All (${students.length})` },
                  { id: 'active', label: `Active (${students.filter((row) => !isPastRecord(row)).length})` },
                  { id: 'past', label: `Past / Cleared (${students.filter((row) => isPastRecord(row)).length})` },
                ].map((option) => {
                  const selected = clearanceScope === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setClearanceScope(option.id)}
                      style={{
                        border: 'none',
                        backgroundColor: selected ? '#2E3D28' : 'transparent',
                        color: selected ? '#FFFFFF' : '#51664C',
                        padding: '0.4rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.76rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                      }}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
              {clearanceCycles.length > 1 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', fontWeight: '700', color: '#51664C' }}>
                  <span>Clearance Cycle:</span>
                  <select
                    aria-label="Filter by clearance cycle"
                    value={selectedCycleKey}
                    onChange={(event) => setSelectedCycleKey(event.target.value)}
                    style={{
                      border: '1px solid #DCE3D3',
                      backgroundColor: '#F6F8F4',
                      color: '#29352A',
                      borderRadius: '10px',
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.78rem',
                      fontWeight: '600',
                    }}
                  >
                    <option value="all">All Clearances ({clearanceCycles.length})</option>
                    {clearanceCycles.map((cycle) => (
                      <option key={cycle.key} value={cycle.key}>
                        {cycle.label}{cycle.isActive ? '' : ' (Archived)'}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}
          <div key={activePage} className="page-fade-in">
            {page}
          </div>
        </>
      )}
    </SignatoryLayout>
  )
}
