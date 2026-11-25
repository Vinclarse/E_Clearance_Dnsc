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
  profileFromAccount,
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

export default function SignatoryApp() {
  const [activePage, setActivePage] = useState('SIG1')
  const [profile, setProfile] = useState(emptyProfile)
  const [notifications, setNotifications] = useState([])
  const [students, setStudents] = useState([])
  const [cohort, setCohort] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [loadError, setLoadError] = useState('')
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
    if (!student) return

    const applyLocal = (row) => {
      if (String(row.id) !== String(id)) return row
      return {
        ...row,
        status: updates.status || row.status,
        validated: updates.validated === true ? true : row.validated,
      }
    }

    try {
      await applySignatoryUpdate(student, updates)
      setStudents((rows) => rows.map(applyLocal))
      setCohort((rows) => rows.map(applyLocal))
    } catch (error) {
      const message = error?.response?.data?.errors?.detail
        || error?.response?.data?.message
        || error.message
        || 'The clearance record could not be updated.'
      addNotification({
        title: 'Update was not saved',
        desc: message === 'Error' ? 'The clearance record could not be updated.' : message,
      })
      return
    }

    try {
      const records = await fetchSignatoryRecords()
      setStudents(records.queue || [])
      setCohort(records.cohort || [])
      setMetrics(records.metrics || null)
    } catch (error) {
      const message = error?.response?.data?.errors?.detail
        || error?.response?.data?.message
        || error.message
        || 'The updated list could not be refreshed.'
      addNotification({
        title: 'Saved, but the list could not be refreshed',
        desc: message === 'Error' ? 'The updated list could not be refreshed.' : message,
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
      title = 'Deficiency Flagged'
      desc = `${student.name}'s clearance was flagged for a deficiency.`
    }

    addNotification({ title, desc })
  }

  let page
  switch (activePage) {
    case 'SIG2':
      page = <SIG2 students={students} onUpdateStudent={updateStudent} />
      break
    case 'SIG3':
      page = <SIG3 students={students} onUpdateStudent={updateStudent} />
      break
    case 'SIG5':
      page = <SIG5 students={cohort} onUpdateStudent={updateStudent} />
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
          students={students}
          metrics={metrics}
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
          {page}
        </>
      )}
    </SignatoryLayout>
  )
}
