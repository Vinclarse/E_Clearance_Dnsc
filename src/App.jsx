import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google'
import StudentDashboard from './pages/StudentDashboard.jsx'
import PortalLoading from './components/PortalLoading.jsx'
import apiClient from './services/api.js'
import { accountKindFor, fetchCurrentUser, homePathForAccount } from './services/account.js'
import {
  completePasswordReset,
  requestPasswordReset,
  verifyPasswordReset,
} from './services/passwordReset.js'
import arrowRight from './assets/arrow-right.svg'
import dashboardIllustration from './assets/clearance-dashboard-illustration.svg'
import eyeIcon from './assets/eye.png'
import mailIcon from './assets/mail.png'
import featureMobile from './assets/feature-mobile-friendly.svg'
import featureOffice from './assets/feature-office-approval.svg'
import featureProgress from './assets/feature-progress-tracking.svg'
import featureQr from './assets/feature-qr-verification.svg'
import featureRoles from './assets/feature-role-based-access.svg'
import featureSecure from './assets/feature-secure-records.svg'
import officeAccounting from './assets/office-accounting.svg'
import officeLibrary from './assets/office-library.svg'
import officeStudentAffairs from './assets/office-student-affairs.svg'
import roleAdmin from './assets/role-administrator.svg'
import roleOfficer from './assets/role-clearance-officer.svg'
import roleStudent from './assets/role-student.svg'
import shieldCheck from './assets/shield-check.svg'
import statusApproved from './assets/status-approved.svg'
import statusCompleted from './assets/status-completed.svg'
import statusProgress from './assets/status-in-progress.svg'
import statusPending from './assets/status-pending.svg'
import statusRejected from './assets/status-rejected.svg'

const AdminPortal = lazy(() => import('./AdminPortal.jsx'))
const SignatoryPortal = lazy(() => import('./signatory/SignatoryApp.jsx'))

const processSteps = [
  {
    title: 'Log In',
    description:
      'Access ClearanceDNSC using your registered account and view your student clearance dashboard.',
  },
  {
    title: 'Start Your Clearance',
    description:
      'Submit your clearance request and check the list of offices that need to review your requirements.',
  },
  {
    title: 'Offices Review and Approve',
    description:
      'Assigned clearance officers review your records and update the status of their respective office items.',
  },
  {
    title: 'Track Until Completed',
    description:
      'Monitor your clearance progress and check which offices have approved your request until completion.',
  },
]

const features = [
  {
    title: 'Progress Tracking',
    description:
      'Monitor your clearance status in real time and easily identify which offices have completed their reviews.',
    image: featureProgress,
  },
  {
    title: 'Role-Based Access',
    description:
      'Separate access for students, clearance officers, and administrators based on their assigned responsibilities.',
    image: featureRoles,
  },
  {
    title: 'Office Approval',
    description:
      'Allow assigned offices to review clearance items, approve requests, or provide remarks when necessary.',
    image: featureOffice,
  },
  {
    title: 'Secure Records',
    description:
      'Keep clearance information organized and accessible to authorized users through a centralized system.',
    image: featureSecure,
  },
  {
    title: 'Mobile Friendly',
    description:
      'Access your clearance dashboard using a desktop, laptop, tablet, or mobile device wherever needed.',
    image: featureMobile,
  },
  {
    title: 'QR-Verified Clearance',
    description:
      'Support clearance verification through QR codes for convenient checking of completed clearance records.',
    image: featureQr,
  },
]

const roles = [
  {
    title: 'Student',
    description:
      'Submit clearance requests, view required offices, monitor approval statuses, and track overall clearance progress.',
    image: roleStudent,
  },
  {
    title: 'Clearance Officer',
    description:
      'View assigned student clearance requests, review submitted items, approve or reject requests, and provide remarks.',
    image: roleOfficer,
  },
  {
    title: 'Administrator',
    description:
      'Manage system users, offices, clearance requirements, reports, and system activity records.',
    image: roleAdmin,
  },
]

const clearanceStatuses = [
  { title: 'Pending', image: statusPending, className: 'status-pending' },
  { title: 'In Progress', image: statusProgress, className: 'status-progress' },
  { title: 'Approved', image: statusApproved, className: 'status-approved' },
  { title: 'Rejected', image: statusRejected, className: 'status-rejected' },
  { title: 'Completed', image: statusCompleted, className: 'status-completed' },
]

function storeAuthTokens(responseData) {
  const tokenPair = responseData?.data ?? responseData

  if (typeof tokenPair?.access !== 'string' || !tokenPair.access) {
    throw new Error('The server did not return an access token. Please try again.')
  }

  localStorage.setItem('auth_token', tokenPair.access)
  if (typeof tokenPair.refresh === 'string' && tokenPair.refresh) {
    localStorage.setItem('auth_refresh_token', tokenPair.refresh)
  } else {
    localStorage.removeItem('auth_refresh_token')
  }
}

function getLoginErrorMessage(error) {
  const responseData = error.response?.data
  const errorData = responseData?.data ?? responseData
  const errors = errorData?.errors ?? responseData?.errors
  const fieldError = Object.entries(errors ?? {})
    .filter(([key]) => key !== 'code' && key !== 'messages')
    .flatMap(([, value]) => (Array.isArray(value) ? value : [value]))
    .filter((value) => typeof value === 'string')
    .join(' ') || undefined
  const message =
    errorData?.detail ??
    errors?.detail ??
    errorData?.error ??
    errors?.error ??
    fieldError ??
    (responseData?.message !== 'Error' ? responseData?.message : undefined)

  if (typeof message === 'string') return message
  if (!error.response) {
    return 'Could not reach the E-Clearance API. Check your connection and try again.'
  }
  return error.message || 'Sign-in failed. Please try again.'
}

async function openAccountHome() {
  try {
    const profile = await fetchCurrentUser()
    window.location.assign(homePathForAccount(profile))
  } catch (error) {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_refresh_token')
    throw error
  }
}

function ForgotPasswordPage() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [changeToken, setChangeToken] = useState('')
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const showFeedback = (text, tone) => {
    setMessage(text)
    setMessageTone(tone)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    showFeedback('', '')
    const formData = new FormData(event.currentTarget)

    if (step === 3) {
      const newPassword = String(formData.get('new-password') ?? '')
      if (newPassword !== String(formData.get('confirm-password') ?? '')) {
        showFeedback('The passwords do not match.', 'error')
        return
      }
    }

    setIsSubmitting(true)

    try {
      if (step === 1) {
        const address = String(formData.get('email') ?? '').trim()
        const result = await requestPasswordReset(address)
        setEmail(address)
        setChangeToken('')
        setStep(2)
        showFeedback(result.detail, 'success')
      } else if (step === 2) {
        const code = String(formData.get('code') ?? '').trim()
        const result = await verifyPasswordReset(email, code)
        setChangeToken(result.changeToken)
        setStep(3)
        showFeedback('', '')
      } else {
        await completePasswordReset(changeToken, String(formData.get('new-password') ?? ''))
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_refresh_token')
        window.location.assign('/login?password_reset=success')
      }
    } catch (error) {
      showFeedback(getLoginErrorMessage(error), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    showFeedback('', '')
    setIsSubmitting(true)
    try {
      const result = await requestPasswordReset(email)
      showFeedback(result.detail, 'success')
    } catch (error) {
      showFeedback(getLoginErrorMessage(error), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetSteps = [
    { title: 'Enter your email', description: 'We send a code to your registered address' },
    { title: 'Verify the code', description: 'Type the 6-digit code from your inbox' },
    { title: 'Create a new password', description: 'Choose something secure and easy to remember' },
  ]

  return (
    <main className="reset-page">
      <section className="reset-intro" aria-labelledby="reset-intro-title">
        <a className="reset-brand" href="/" aria-label="E-Clearance System home">
          <span className="reset-brand-mark" aria-hidden="true" />
          <span className="reset-brand-text">
            <strong>E-Clearance System</strong>
            <small>Davao del Norte State College</small>
          </span>
        </a>

        <div className="reset-intro-copy">
          <h1 id="reset-intro-title">Forgot your password?</h1>
          <p className="reset-intro-description">
            No worries. Verify your email and set a new password in three quick steps.
          </p>

          <ol className="reset-steps" aria-label="Password reset steps">
            {resetSteps.map((item, index) => (
              <li key={item.title} className={step === index + 1 ? 'active' : ''}>
                <span className="reset-step-count">{index + 1}</span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <footer className="reset-footer">
          <span>Institute of Computing · E-Clearance System</span>
        </footer>
      </section>

      <section className="reset-panel" aria-label="Reset password form">
        <div className="reset-card">
          <div className="reset-progress" aria-hidden="true">
            {[1, 2, 3].map((item) => (
              <span key={item} data-filled={item <= step ? 'true' : 'false'} />
            ))}
          </div>

          <form className="reset-form" onSubmit={handleSubmit} key={step}>
            <p className="reset-step-kicker">Step {step} of 3</p>

            {step === 1 ? (
              <>
                <h2>Enter your email</h2>
                <p className="reset-step-copy">
                  Type the email address registered to your account. We will send a 6-digit verification code to it.
                </p>
                <label htmlFor="reset-email">Registered Email Address</label>
                <div className="reset-input-wrap">
                  <img src={mailIcon} alt="" aria-hidden="true" />
                  <input
                    id="reset-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@school.edu"
                    required
                  />
                </div>
              </>
            ) : step === 2 ? (
              <>
                <h2>Verify the code</h2>
                <p className="reset-step-copy">
                  Enter the 6-digit verification code sent to <strong>{email}</strong>.
                </p>
                <label htmlFor="reset-code">Verification Code</label>
                <input
                  id="reset-code"
                  name="code"
                  autoComplete="one-time-code"
                  inputMode="text"
                  minLength={4}
                  maxLength={8}
                  placeholder="Enter the code"
                  required
                />
                <div className="reset-secondary-actions">
                  <button className="reset-inline-button" type="button" onClick={handleResend} disabled={isSubmitting}>
                    Resend code
                  </button>
                  <button
                    className="reset-inline-button"
                    type="button"
                    onClick={() => {
                      setChangeToken('')
                      showFeedback('', '')
                      setStep(1)
                    }}
                    disabled={isSubmitting}
                  >
                    Use a different email
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>Create a new password</h2>
                <p className="reset-step-copy">Choose something secure and easy to remember.</p>
                <label htmlFor="new-password">New Password</label>
                <div className="reset-input-wrap has-toggle">
                  <input
                    id="new-password"
                    name="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    className="password-visibility-toggle"
                    type="button"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showNewPassword}
                    onClick={() => setShowNewPassword((visible) => !visible)}
                  >
                    <img src={eyeIcon} alt="" />
                    {!showNewPassword && <span className="password-eye-slash" aria-hidden="true" />}
                  </button>
                </div>
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="reset-input-wrap has-toggle">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    className="password-visibility-toggle"
                    type="button"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showConfirmPassword}
                    onClick={() => setShowConfirmPassword((visible) => !visible)}
                  >
                    <img src={eyeIcon} alt="" />
                    {!showConfirmPassword && <span className="password-eye-slash" aria-hidden="true" />}
                  </button>
                </div>
                <p className="reset-password-hint">At least 8 characters. Avoid common or all-numeric passwords.</p>
              </>
            )}

            {message && (
              <p className={`reset-feedback ${messageTone}`} role={messageTone === 'error' ? 'alert' : 'status'}>
                {message}
              </p>
            )}

            <button className="reset-submit-button" type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Please wait…'
                : step === 1
                  ? 'Send Verification Code'
                  : step === 2
                    ? 'Verify Code'
                    : 'Update Password'}
            </button>
          </form>

          <div className="reset-actions">
            <a className="reset-back-link" href="/login">
              ← Back to Login
            </a>
            <p className="reset-help">
              Need help?{' '}
              <a href="mailto:registrar@dnsc.edu.ph">Contact the Registrar</a>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

function LoginPage() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [loginMessage, setLoginMessage] = useState(() =>
    new URLSearchParams(window.location.search).get('password_reset') === 'success'
      ? 'Your password has been updated. Sign in with your new password.'
      : '',
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? ''
  const googleButtonRef = useRef(null)
  const [googleButtonWidth, setGoogleButtonWidth] = useState(0)

  useEffect(() => {
    const button = googleButtonRef.current
    if (!button) return undefined

    const measure = () => {
      const next = Math.max(200, Math.min(400, Math.round(button.clientWidth)))
      setGoogleButtonWidth((current) => (current === next ? current : next))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(button)
    return () => observer.disconnect()
  }, [googleClientId])

  const handleLogin = async (event) => {
    event.preventDefault()
    setLoginMessage('')
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)
    const username = String(formData.get('identifier') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    try {
      const response = await apiClient.post('login/', { username, password })
      storeAuthTokens(response.data)
      await openAccountHome()
    } catch (error) {
      setLoginMessage(getLoginErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse.credential) {
      setLoginMessage('Google did not return an ID token. Please try again.')
      return
    }

    setLoginMessage('')
    setIsGoogleSubmitting(true)

    try {
      const response = await apiClient.post('auth/google/', {
        token: credentialResponse.credential,
      })
      storeAuthTokens(response.data)
      await openAccountHome()
    } catch (error) {
      setLoginMessage(getLoginErrorMessage(error))
    } finally {
      setIsGoogleSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-intro" aria-labelledby="login-intro-title">
        <a className="login-brand" href="/" aria-label="ClearanceDNSC home">
          <span className="login-brand-mark" aria-hidden="true" />
          <span>ClearanceDNSC</span>
        </a>
        <div className="login-intro-copy">
          <p className="login-kicker">Student Clearance Management System</p>
          <h1 id="login-intro-title">
            Your clearance,<br />
            <span>made simpler.</span>
          </h1>
          <p className="login-intro-description">
            Manage your student clearance, follow office approvals, and monitor
            your progress through one convenient online system.
          </p>
          <ul className="login-benefits">
            <li>
              <span className="login-benefit-icon" aria-hidden="true">
                <img src={statusApproved} alt="" />
              </span>
              Track your clearance progress
            </li>
            <li>
              <span className="login-benefit-icon" aria-hidden="true">
                <img src={officeAccounting} alt="" />
              </span>
              Check office approval statuses
            </li>
            <li>
              <span className="login-benefit-icon" aria-hidden="true">
                <img src={shieldCheck} alt="" />
              </span>
              Access your clearance securely
            </li>
          </ul>
        </div>
        <footer className="login-intro-footer">
          <strong>Davao del Norte State College</strong>
          <span>A Web-Based Student Clearance Management System</span>
          <span>© {new Date().getFullYear()} ClearanceDNSC · Student Project</span>
        </footer>
      </section>

      <section className="login-form-panel" aria-labelledby="login-title">
        <div className="login-form-content">
          <p className="eyebrow">Welcome back</p>
          <h2 id="login-title">Sign in to your account</h2>
          <p className="login-form-description">
            Enter your account details to access your student clearance.
          </p>
          <form
            className="login-form"
            onSubmit={handleLogin}
          >
            <label htmlFor="student-identifier">Student ID or Email</label>
            <input
              id="student-identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              placeholder="Enter your student ID or email"
              required
            />
            <div className="login-password-label">
              <label htmlFor="login-password">Password</label>
              <a
                className="login-text-button"
                href="/forgot-password"
              >
                Forgot password?
              </a>
            </div>
            <div className="login-password-field">
              <input
                id="login-password"
                name="password"
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                required
              />
              <button
                className="password-visibility-toggle"
                type="button"
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                aria-pressed={isPasswordVisible}
                onClick={() => setIsPasswordVisible((visible) => !visible)}
              >
                <img src={eyeIcon} alt="" />
                {!isPasswordVisible && <span className="password-eye-slash" aria-hidden="true" />}
              </button>
            </div>
            <button
              className="login-submit-button"
              type="submit"
              disabled={isSubmitting || isGoogleSubmitting}
            >
              <span className="login-submit-icon" aria-hidden="true">
                <img src={arrowRight} alt="" />
              </span>
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
            {googleClientId ? (
              <div
                ref={googleButtonRef}
                className="login-google-button-container"
                aria-disabled={isSubmitting || isGoogleSubmitting}
              >
                <GoogleOAuthProvider clientId={googleClientId} locale="en">
                  <span className="login-google-button-art" aria-hidden="true">
                    <svg className="login-google-mark" viewBox="0 0 24 24" focusable="false">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 13.04a6.96 6.96 0 0 1 0-4.08V6.12H2.18a11 11 0 0 0 0 9.76l3.66-2.84z" />
                      <path fill="#EA4335" d="M12 4.36c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45.99 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.12l3.66 2.84c.87-2.6 3.3-4.6 6.16-4.6z" />
                    </svg>
                    <span>Continue with Google</span>
                  </span>
                  {googleButtonWidth > 0 && (
                    <GoogleLogin
                      key={googleButtonWidth}
                      onSuccess={handleGoogleSuccess}
                      onError={() => setLoginMessage('Google sign-in could not start. Allow popups for this site, then try again.')}
                      text="continue_with"
                      size="large"
                      theme="outline"
                      shape="rectangular"
                      logo_alignment="left"
                      width={googleButtonWidth}
                    />
                  )}
                </GoogleOAuthProvider>
              </div>
            ) : (
              <button
                className="login-google-button"
                type="button"
                disabled
                title="Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in."
              >
                Google sign-in needs setup
              </button>
            )}
            {loginMessage && <p className="login-message" role="status">{loginMessage}</p>}
          </form>
          <p className="login-privacy-note">
            <img src={shieldCheck} alt="" aria-hidden="true" />
            Your account information should remain private.
          </p>
          <a className="login-home-link" href="/">
            <img src={arrowRight} alt="" aria-hidden="true" />
            Back to homepage
          </a>
        </div>
      </section>
    </main>
  )
}

function DashboardPreview() {
  return (
    <div className="dashboard-preview" aria-label="Illustration of the clearance dashboard">
      <div className="preview-art" aria-hidden="true">
        <img src={dashboardIllustration} alt="" />
      </div>
      <div className="preview-card">
        <div className="preview-title">
          <div>
            <strong>Clearance Overview</strong>
            <small>Sample student dashboard</small>
          </div>
          <span className="status status-progress">In Progress</span>
        </div>
        <div className="progress-label">
          <span>Overall Progress</span>
          <strong>60%</strong>
        </div>
        <div className="progress-track"><span /></div>
        <OfficeRow image={officeLibrary} name="Library" status="Approved" statusClass="status-approved" statusImage={statusApproved} />
        <OfficeRow image={officeAccounting} name="Accounting" status="In Progress" statusClass="status-progress" statusImage={statusProgress} />
        <OfficeRow image={officeStudentAffairs} name="Student Affairs" status="Pending" statusClass="status-pending" statusImage={statusPending} />
      </div>
    </div>
  )
}

function OfficeRow({ image, name, status, statusClass, statusImage }) {
  return (
    <div className="office-row">
      <span className="office-icon" aria-hidden="true"><img src={image} alt="" /></span>
      <span className="office-name">
        <strong>{name}</strong>
        <small>Office clearance</small>
      </span>
      <span className={`status ${statusClass}`}>
        <img src={statusImage} alt="" />
        {status}
      </span>
    </div>
  )
}

function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <>
      <header className="site-header">
        <div className="container header-content">
          <a className="brand" href="#home" aria-label="ClearanceDNSC home">
            <span className="brand-mark" aria-hidden="true" />
            <span>ClearanceDNSC</span>
          </a>
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={isMenuOpen}
            aria-controls="primary-navigation"
            aria-label={isMenuOpen ? 'Close navigation' : 'Open navigation'}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
          <nav
            className={`navigation${isMenuOpen ? ' is-open' : ''}`}
            id="primary-navigation"
            aria-label="Main navigation"
          >
            {[
              ['Home', '#home'],
              ['How It Works', '#how-it-works'],
              ['Features', '#features'],
              ['Roles', '#roles'],
            ].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setIsMenuOpen(false)}>{label}</a>
            ))}
          </nav>
          <a className="button button-small header-login" href="/login">
            Log In
            <span aria-hidden="true"><img src={arrowRight} alt="" /></span>
          </a>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="container hero-layout">
            <div className="hero-copy">
              <p className="eyebrow eyebrow-pill">
                <span aria-hidden="true"><img src={shieldCheck} alt="" /></span>
                Student Clearance Management System
              </p>
              <h1>Your Student Clearance,<br className="hero-title-break" /> Now Simpler and Paperless.</h1>
              <p className="hero-description">
                Say goodbye to long paper-based clearance processes. Manage your
                clearance requests, receive office approvals, and track your
                progress in one convenient online system.
              </p>
              <div className="hero-actions">
                <a className="button" href="/login">
                  Log In
                  <span aria-hidden="true"><img src={arrowRight} alt="" /></span>
                </a>
                <a className="button button-light" href="#how-it-works">Learn How It Works</a>
              </div>
              <p className="hero-note">
                <span aria-hidden="true"><img src={shieldCheck} alt="" /></span>
                Organized. Transparent. Accessible.
              </p>
            </div>
            <DashboardPreview />
          </div>
        </section>

        <section className="section process-section" id="how-it-works">
          <div className="container">
            <SectionHeading
              eyebrow="Simple Process"
              title="How It Works"
              description="Complete your student clearance through four simple steps without the hassle of traditional paperwork."
            />
            <div className="process-grid">
              {processSteps.map((step, index) => (
                <article className="process-card" key={step.title}>
                  <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section features-section" id="features">
          <div className="container">
            <SectionHeading
              eyebrow="What We Offer"
              title="Everything in One Place"
              description="A more organized way to manage student clearance through accessible and convenient digital features."
            />
            <div className="features-grid">
              {features.map((feature) => (
                <article className="feature-card" key={feature.title}>
                  <span className="feature-icon" aria-hidden="true"><img src={feature.image} alt="" /></span>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section roles-section" id="roles">
          <div className="container">
            <SectionHeading
              eyebrow="Designed for Everyone"
              title="Who Can Use ClearanceDNSC?"
              description="Each account has its own responsibilities to ensure an organized clearance process across the institution."
            />
            <div className="roles-grid">
              {roles.map((role) => (
                <article className="role-card" key={role.title}>
                  <span className="role-icon" aria-hidden="true"><img src={role.image} alt="" /></span>
                  <h3>{role.title}</h3>
                  <p>{role.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section status-section" aria-labelledby="status-title">
          <div className="container">
            <SectionHeading
              eyebrow="Know Your Progress"
              title="Understanding Clearance Status"
              description="Every clearance item has a status to help you understand its current progress and approval result."
              titleId="status-title"
            />
            <ul className="status-list" aria-label="Clearance status meanings">
              {clearanceStatuses.map((status) => (
                <li key={status.title}>
                  <span className={`status ${status.className}`}>
                    <img src={status.image} alt="" />
                    {status.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="cta-section" id="get-started">
          <div className="container">
            <div className="cta-card">
              <div>
                <h2>Ready to Manage Your Clearance?</h2>
                <p>Access your account and experience a simpler way to complete your student clearance.</p>
              </div>
              <a className="button button-light" href="/login">
                Log In to Your Account <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-content">
          <div>
            <a className="brand footer-brand" href="#home"><span>ClearanceDNSC</span></a>
            <p>Davao del Norte State College</p>
            <p>A Web-Based Student Clearance Management System</p>
          </div>
          <div className="footer-project">
            <strong>Student Project</strong>
            <p>This website uses mock data for demonstration and academic purposes.</p>
            <p>© {new Date().getFullYear()} ClearanceDNSC</p>
          </div>
        </div>
      </footer>
    </>
  )
}

function SectionHeading({ eyebrow, title, description, titleId }) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={titleId}>{title}</h2>
      <p>{description}</p>
    </div>
  )
}

function App() {
  const [currentPath, setCurrentPath] = useState(
    () => window.location.pathname.replace(/\/+$/, '') || '/',
  )
  const isLoginPage = currentPath === '/login'
  const isForgotPasswordPage = currentPath === '/forgot-password'
  const isDashboardPage = currentPath === '/dashboard'
  const isAdminPage = currentPath === '/admin' || currentPath.startsWith('/admin/')
  const isSignatoryPage = currentPath === '/signatory' || currentPath.startsWith('/signatory/')
  const hasAuthToken = Boolean(localStorage.getItem('auth_token'))
  const [accountKind, setAccountKind] = useState(hasAuthToken ? 'unknown' : 'anonymous')
  const isDesignPreview =
    new URLSearchParams(window.location.search).get('preview') === 'true'

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname.replace(/\/+$/, '') || '/')
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (!hasAuthToken) return undefined

    let isCurrent = true
    fetchCurrentUser()
      .then((profile) => {
        if (isCurrent) setAccountKind(accountKindFor(profile))
      })
      .catch(() => {
        if (isCurrent) setAccountKind('error')
      })

    return () => {
      isCurrent = false
    }
  }, [hasAuthToken])

  useEffect(() => {
    if ((isAdminPage || isSignatoryPage) && !hasAuthToken) {
      window.location.replace(`/login?next=${encodeURIComponent(currentPath)}`)
      return
    }
    if (isDashboardPage && !hasAuthToken && !isDesignPreview) {
      window.location.replace('/login')
      return
    }
    if (accountKind === 'admin' && (isDashboardPage || isLoginPage || isSignatoryPage)) {
      window.location.replace('/admin')
      return
    }
    if (accountKind === 'signatory' && (isDashboardPage || isLoginPage || isAdminPage)) {
      window.location.replace('/signatory')
      return
    }
    if (accountKind === 'student' && (isAdminPage || isLoginPage || isSignatoryPage)) {
      window.location.replace('/dashboard')
    }

    document.title = isForgotPasswordPage
      ? 'Forgot Password | ClearanceDNSC'
      : isLoginPage
        ? 'Account Access | ClearanceDNSC'
        : isDashboardPage
        ? 'Student Dashboard | ClearanceDNSC'
        : isAdminPage
          ? 'Admin Portal | ClearanceDNSC'
          : isSignatoryPage
            ? 'Signatory Portal | ClearanceDNSC'
            : 'ClearanceDNSC | Student Clearance, Simplified'
  }, [accountKind, currentPath, hasAuthToken, isAdminPage, isDashboardPage, isDesignPreview, isForgotPasswordPage, isLoginPage, isSignatoryPage])

  if (hasAuthToken && accountKind === 'unknown' && (isAdminPage || isDashboardPage || isLoginPage || isSignatoryPage)) {
    return <PortalLoading title="Checking your account" detail="Confirming which portal this sign-in should open." />
  }
  if (accountKind === 'error' && (isAdminPage || isDashboardPage || isSignatoryPage)) {
    return (
      <div role="alert">
        <p>Could not confirm this account. Please sign in again.</p>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_refresh_token')
            window.location.assign('/login')
          }}
        >
          Back to sign in
        </button>
      </div>
    )
  }
  if (isSignatoryPage) {
    return hasAuthToken && accountKind === 'signatory' ? (
      <Suspense fallback={<PortalLoading title="Loading the signatory portal" detail="Opening the approval queue for this account." />}>
        <SignatoryPortal />
      </Suspense>
    ) : null
  }
  if (isAdminPage) {
    return hasAuthToken && accountKind === 'admin' ? (
      <Suspense fallback={<PortalLoading title="Loading the admin portal" detail="Opening the institute dashboard." />}>
        <AdminPortal />
      </Suspense>
    ) : null
  }
  if (isDashboardPage) {
    if (isDesignPreview && !hasAuthToken) return <StudentDashboard />
    return hasAuthToken && accountKind === 'student' ? <StudentDashboard /> : null
  }
  if (isForgotPasswordPage) return <ForgotPasswordPage />
  if (isLoginPage && hasAuthToken) return null
  return isLoginPage ? <LoginPage /> : <HomePage />
}

export default App
