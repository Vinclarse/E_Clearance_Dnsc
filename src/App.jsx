import { useEffect, useState } from 'react'
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google'
import StudentDashboard from './pages/StudentDashboard.jsx'
import apiClient from './services/api.js'
import arrowRight from './assets/arrow-right.svg'
import dashboardIllustration from './assets/clearance-dashboard-illustration.svg'
import eyeIcon from './assets/eye.png'
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
  const fieldError = Object.values(errors ?? {})
    .flat()
    .find((value) => typeof value === 'string')
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

function PasswordResetForm({ onCancel, onComplete }) {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [changeToken, setChangeToken] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setIsSubmitting(true)
    const formData = new FormData(event.currentTarget)

    try {
      if (step === 1) {
        const address = String(formData.get('email') ?? '').trim()
        await apiClient.post('password-reset/request/', { email: address })
        setEmail(address)
        setStep(2)
        setMessage('If this email is registered, a verification code has been sent.')
      } else if (step === 2) {
        const code = String(formData.get('code') ?? '').trim()
        const response = await apiClient.post('password-reset/verify/', { email, code })
        const result = response.data?.data ?? response.data
        if (typeof result?.change_token !== 'string' || !result.change_token) {
          throw new Error('The API did not return a password reset token. Request a new code.')
        }
        setChangeToken(result.change_token)
        setStep(3)
      } else {
        const newPassword = String(formData.get('new-password') ?? '')
        if (newPassword !== String(formData.get('confirm-password') ?? '')) {
          setMessage('The passwords do not match.')
          return
        }
        await apiClient.post('password-reset/change/', {
          change_token: changeToken,
          new_password: newPassword,
        })
        onComplete()
      }
    } catch (error) {
      setMessage(getLoginErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      {step === 1 ? (
        <>
          <label htmlFor="reset-email">Account email</label>
          <input
            id="reset-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </>
      ) : step === 2 ? (
        <>
          <p className="login-form-description">Enter the verification code sent to {email}.</p>
          <label htmlFor="reset-code">Verification code</label>
          <input id="reset-code" name="code" autoComplete="one-time-code" minLength={4} maxLength={8} required />
        </>
      ) : (
        <>
          <label htmlFor="new-password">New password</label>
          <input id="new-password" name="new-password" type="password" autoComplete="new-password" required />
          <label htmlFor="confirm-password">Confirm new password</label>
          <input id="confirm-password" name="confirm-password" type="password" autoComplete="new-password" required />
        </>
      )}
      <button className="login-submit-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Please wait…' : step === 1 ? 'Send code' : step === 2 ? 'Verify code' : 'Update password'}
      </button>
      <button className="login-text-button" type="button" onClick={onCancel}>
        Back to sign in
      </button>
      {message && <p className="login-message" role="status">{message}</p>}
    </form>
  )
}

function LoginPage() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [loginMessage, setLoginMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? ''

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
      window.location.assign('/dashboard')
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
      window.location.assign('/dashboard')
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
          <h2 id="login-title">{showPasswordReset ? 'Reset your password' : 'Sign in to your account'}</h2>
          <p className="login-form-description">
            {showPasswordReset
              ? 'Request a verification code, then choose a new password.'
              : 'Enter your account details to access your student clearance.'}
          </p>
          {showPasswordReset ? (
            <PasswordResetForm
              onCancel={() => {
                setShowPasswordReset(false)
                setLoginMessage('')
              }}
              onComplete={() => {
                setShowPasswordReset(false)
                setLoginMessage('Your password has been updated. Sign in with your new password.')
              }}
            />
          ) : (
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
              <button
                className="login-text-button"
                type="button"
                onClick={() => {
                  setShowPasswordReset(true)
                  setLoginMessage('')
                }}
              >
                Forgot password?
              </button>
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
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setLoginMessage('Google sign-in failed. Please try again.')}
                    text="continue_with"
                    size="large"
                    theme="outline"
                    shape="rectangular"
                    logo_alignment="left"
                    width="400"
                  />
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
          )}
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
  const currentPath = window.location.pathname.replace(/\/+$/, '') || '/'
  const isLoginPage = currentPath === '/login'
  const isDashboardPage = currentPath === '/dashboard'
  const hasAuthToken = Boolean(localStorage.getItem('auth_token'))
  const isDesignPreview =
    new URLSearchParams(window.location.search).get('preview') === 'true'

  useEffect(() => {
    if (isDashboardPage && !hasAuthToken && !isDesignPreview) {
      window.location.replace('/login')
      return
    }
    if (isLoginPage && hasAuthToken) {
      window.location.replace('/dashboard')
      return
    }

    document.title = isLoginPage
      ? 'Account Access | ClearanceDNSC'
      : isDashboardPage
        ? 'Student Dashboard | ClearanceDNSC'
        : 'ClearanceDNSC | Student Clearance, Simplified'
  }, [hasAuthToken, isDashboardPage, isDesignPreview, isLoginPage])

  if (isDashboardPage) {
    return hasAuthToken || isDesignPreview ? <StudentDashboard /> : null
  }
  if (isLoginPage && hasAuthToken) return null
  return isLoginPage ? <LoginPage /> : <HomePage />
}

export default App
