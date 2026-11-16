import { useEffect, useState } from 'react'
import SignatoryLayout from './SignatoryLayout.jsx'
import SIG1 from './SIG1.jsx'
import SIG2 from './SIG2.jsx'
import SIG3 from './SIG3.jsx'
import SIG5 from './SIG-5.jsx'
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
  }, [])

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
    const student = students.find((item) => item.id === id)
    if (!student) return

    try {
      await applySignatoryUpdate(student, updates)
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

    let title = 'Clearance Record Updated'
    let desc = `${student.name}'s clearance record was updated.`
    if (updates.proofStatus === 'resolved') {
      title = 'Settlement Proof Approved'
      desc = `Settlement proof for ${student.name} was approved.`
    } else if (updates.proofStatus === 'submitted') {
      title = 'Settlement Proof Submitted'
      desc = `Settlement proof for ${student.name} was submitted for review.`
    } else if (updates.validated !== undefined) {
      title = updates.validated ? 'Enrollment Validated' : 'Enrollment Validation Removed'
      desc = updates.validated
        ? `${student.name}'s enrollment was validated.`
        : `${student.name}'s enrollment validation was removed.`
    } else if (updates.status === 'Cleared') {
      title = 'Clearance Approved'
      desc = `${student.name}'s clearance was approved.`
    } else if (updates.status === 'Deficiency') {
      title = 'Deficiency Flagged'
      desc = `${student.name}'s clearance was flagged for a deficiency.`
    }

    addNotification({ title, desc })
    setStudents((current) => current.map((student) => {
      if (student.id !== id) return student

      const updatedStudent = { ...student, ...updates }
      if (updates.status === 'Cleared') {
        updatedStudent.steps = student.steps.map((cleared, index) => cleared || index === 3)
        if (student.proofStatus === 'submitted') updatedStudent.proofStatus = 'resolved'
        if (student.fee !== '—') updatedStudent.resolvedAmount = student.fee
        updatedStudent.fee = '—'
        updatedStudent.proofDetails = ''
        updatedStudent.note = ''
      } else if (updates.status === 'Deficiency' && updates.proofStatus === undefined) {
        updatedStudent.proof = false
        updatedStudent.proofStatus = 'pending'
      }

      return updatedStudent
    }))
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
    >
      {loading ? (
        <div className="portal-loading" role="status">
          <span className="portal-loading-spinner" aria-hidden="true" />
          <strong>Loading the signatory portal</strong>
          <span>Getting your queue and notifications.</span>
        </div>
      ) : (
        <>
          {loadError && <p className="portal-loading-error" role="alert">{loadError}</p>}
          {page}
        </>
      )}
    </SignatoryLayout>
  )
}
