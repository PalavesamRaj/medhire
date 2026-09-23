import React from 'react'
import { Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom'
import { CandidateProfileProvider } from './context/CandidateProfileContext'
import PersonalInformation from './pages/candidate/profile-setup/PersonalInformation'
import ProfessionalInformation from './pages/candidate/profile-setup/ProfessionalInformation'
import Education from './pages/candidate/profile-setup/Education'
import WorkExperience from './pages/candidate/profile-setup/WorkExperience'
import Skills from './pages/candidate/profile-setup/Skills'
import Certifications from './pages/candidate/profile-setup/Certifications'
import CareerPreferences from './pages/candidate/profile-setup/CareerPreferences'
import ResumeUpload from './pages/candidate/profile-setup/ResumeUpload'
import ProfileSetupComplete from './pages/candidate/profile-setup/ProfileSetupComplete'
import CandidateDashboard from './pages/candidate/CandidateDashboard'
import MyProfile from './pages/candidate/MyProfile'
import EditProfile from './pages/candidate/EditProfile'
import ResumeManagement from './pages/candidate/ResumeManagement'
import PrivacySettings from './pages/candidate/PrivacySettings'
import JobSearch from './pages/candidate/JobSearch'
import JobDetails from './pages/candidate/JobDetails'
import ApplyJob from './pages/candidate/ApplyJob'
import MyApplications from './pages/candidate/MyApplications'
import SavedJobs from './pages/candidate/SavedJobs'
import CandidateSummary from './pages/candidate/CandidateSummary'
import CandidateLayout from './components/candidate/dashboard/CandidateLayout'
import { CandidateDashboardProvider } from './context/CandidateDashboardContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Home from './pages/Home'
import About from './pages/About'
import HowItWorks from './pages/HowItWorks'
import Contact from './pages/Contact'
import Faq from './pages/Faq'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import Pricing from './pages/Pricing'
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
      <Route path="/candidate" element={<CandidateProfileProvider><Outlet /></CandidateProfileProvider>}>
        <Route index element={<Navigate to="profile/personal" replace />} />
        <Route path="profile/personal" element={<PersonalInformation />} />
        <Route path="profile/professional" element={<ProfessionalInformation />} />
        <Route path="profile/education" element={<Education />} />
        <Route path="profile/work-experience" element={<WorkExperience />} />
        <Route path="profile/skills" element={<Skills />} />
        <Route path="profile/certifications" element={<Certifications />} />
        <Route path="profile/career-preferences" element={<CareerPreferences />} />
        <Route path="profile/resume" element={<ResumeUpload />} />
        <Route path="profile/complete" element={<ProfileSetupComplete />} />
        <Route element={<CandidateDashboardProvider><CandidateLayout /></CandidateDashboardProvider>}>
          <Route path="dashboard" element={<CandidateDashboard />} />
          <Route path="profile" element={<MyProfile />} />
          <Route path="edit-profile" element={<EditProfile />} />
          <Route path="resume-management" element={<ResumeManagement />} />
          <Route path="privacy-settings" element={<PrivacySettings />} />
          <Route path="jobs" element={<JobSearch />} />
          <Route path="jobs/:jobId" element={<JobDetails />} />
          <Route path="jobs/:jobId/apply" element={<ApplyJob />} />
          <Route path="applications" element={<MyApplications />} />
          <Route path="saved-jobs" element={<SavedJobs />} />
          <Route path="summary" element={<CandidateSummary />} />
        </Route>
      </Route>
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
      <Route path="/pricing" element={<SiteLayout><Pricing /></SiteLayout>} />
      </Routes>
    </>
  )
}
