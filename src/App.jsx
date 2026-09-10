import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import About from './pages/About'
import HowItWorks from './pages/HowItWorks'
import Contact from './pages/Contact'
import Faq from './pages/Faq'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import GetStarted from './pages/GetStarted'
import RegisterCandidate from './pages/RegisterCandidate'
import RegisterRecruiter from './pages/RegisterRecruiter'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import EmailVerification from './pages/EmailVerification'
import ResetPassword from './pages/ResetPassword'
import PasswordResetSuccess from './pages/PasswordResetSuccess'
import Placeholder from './pages/Placeholder'

function SiteLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Standalone auth flow — no site nav/footer, matches the Figma "Get Started" screens */}
      <Route path="/get-started" element={<GetStarted />} />
      <Route path="/register/candidate" element={<RegisterCandidate />} />
      <Route path="/register/recruiter" element={<RegisterRecruiter />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email" element={<EmailVerification />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/password-reset-success" element={<PasswordResetSuccess />} />

      {/* Standard site pages */}
      <Route path="/" element={<SiteLayout><Home /></SiteLayout>} />
      <Route path="/about" element={<SiteLayout><About /></SiteLayout>} />
      <Route path="/how-it-works" element={<SiteLayout><HowItWorks /></SiteLayout>} />
      <Route path="/contact" element={<SiteLayout><Contact /></SiteLayout>} />
      <Route path="/faq" element={<SiteLayout><Faq /></SiteLayout>} />
      <Route path="/privacy-policy" element={<SiteLayout><PrivacyPolicy /></SiteLayout>} />
      <Route path="/terms-of-service" element={<SiteLayout><TermsOfService /></SiteLayout>} />
      <Route path="/find-jobs" element={<SiteLayout><Placeholder title="Find Jobs" /></SiteLayout>} />
      <Route path="/for-recruiters" element={<SiteLayout><Placeholder title="For Recruiters" /></SiteLayout>} />
      <Route path="/pricing" element={<SiteLayout><Placeholder title="Pricing" /></SiteLayout>} />
      </Routes>
    </>
  )
}
