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

function isServerNotificationId(id) {
  return /^\d+$/.test(String(id))
}

function mergeNotifications(current, incoming) {
  const incomingIds = new Set(incoming.map((item) => String(item.id)))
  const kept = current.filter((item) => !incomingIds.has(String(item.id)))
  return [...kept, ...incoming]
}

function markReadLocally(notification) {
  return { ...notification, is_read: true, unread: false }
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
  const [notificationError, setNotificationError] = useState('')
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
      if (notes.status === 'fulfilled') {
        setNotifications((current) => mergeNotifications(current, notes.value))
      }
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
        notification.id === id ? markReadLocally(notification) : notification,
      ),
    )
    if (!isServerNotificationId(id)) return
    markNotificationRead(id).catch(() => {})
  }

  const markAllNotificationsAsRead = async () => {
    setNotificationError('')
    let serverIds = []
    setNotifications((current) => {
      serverIds = current.filter((notification) => isServerNotificationId(notification.id)).map((notification) => notification.id)
      return current.map(markReadLocally)
    })
    if (serverIds.length === 0) return
    try {
      await markAllNotificationsRead()
    } catch {
      const results = await Promise.allSettled(serverIds.map((id) => markNotificationRead(id)))
      if (results.some((result) => result.status === 'rejected')) {
        setNotificationError('Could not mark notifications as read. Please try again.')
      }
    }
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

  const isDeficiencyOrProofRecord = (row) =>
    row.status === 'Deficiency' || row.proofStatus === 'submitted' || row.proofStatus === 'resolved'

  const matchesScope = (row) => {
    if (selectedCycleKey !== 'all' && row.clearanceCycleKey !== selectedCycleKey) return false
    if (clearanceScope === 'active') return !isPastRecord(row)
    if (clearanceScope === 'past') return isPastRecord(row)
    return true
  }

  const cycleScoped = (rows) =>
    selectedCycleKey === 'all' ? rows : rows.filter((row) => row.clearanceCycleKey === selectedCycleKey)

  const scopeSource = activePage === 'SIG5'
    ? cycleScoped(cohort)
    : activePage === 'SIG3'
      ? cycleScoped(students.filter(isDeficiencyOrProofRecord))
      : cycleScoped(students)

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
      notificationError={notificationError}
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
            <div className="clearance-cycle-bar clearance-cycle-bar--signatory">
              <div role="group" aria-label="Filter by clearance status" className="clearance-cycle-pills">
                {[
                  { id: 'all', label: `All (${scopeSource.length})` },
                  { id: 'active', label: `Active (${scopeSource.filter((row) => !isPastRecord(row)).length})` },
                  { id: 'past', label: `Past / Cleared (${scopeSource.filter((row) => isPastRecord(row)).length})` },
                ].map((option) => {
                  const selected = clearanceScope === option.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setClearanceScope(option.id)}
                      className={`clearance-cycle-btn${selected ? ' is-active' : ''}`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
              {clearanceCycles.length > 1 && (
                <label className="clearance-cycle-select-wrap">
                  <span className="clearance-cycle-select-label">Clearance Cycle:</span>
                  <select
                    aria-label="Filter by clearance cycle"
                    value={selectedCycleKey}
                    onChange={(event) => setSelectedCycleKey(event.target.value)}
                    className="clearance-cycle-select"
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
