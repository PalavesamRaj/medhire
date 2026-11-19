import React from 'react'
import { Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom'
import { CandidateProfileProvider } from './context/CandidateProfileContext'
const PersonalInformation = React.lazy(() => import('./pages/candidate/profile-setup/PersonalInformation'))
const ProfessionalInformation = React.lazy(() => import('./pages/candidate/profile-setup/ProfessionalInformation'))
const Education = React.lazy(() => import('./pages/candidate/profile-setup/Education'))
const WorkExperience = React.lazy(() => import('./pages/candidate/profile-setup/WorkExperience'))
const Skills = React.lazy(() => import('./pages/candidate/profile-setup/Skills'))
const Certifications = React.lazy(() => import('./pages/candidate/profile-setup/Certifications'))
const CareerPreferences = React.lazy(() => import('./pages/candidate/profile-setup/CareerPreferences'))
const ResumeUpload = React.lazy(() => import('./pages/candidate/profile-setup/ResumeUpload'))
const ProfileSetupComplete = React.lazy(() => import('./pages/candidate/profile-setup/ProfileSetupComplete'))
const CandidateDashboard = React.lazy(() => import('./pages/candidate/CandidateDashboard'))
const MyProfile = React.lazy(() => import('./pages/candidate/MyProfile'))
const EditProfile = React.lazy(() => import('./pages/candidate/EditProfile'))
const ResumeManagement = React.lazy(() => import('./pages/candidate/ResumeManagement'))
const PrivacySettings = React.lazy(() => import('./pages/candidate/PrivacySettings'))
const JobSearch = React.lazy(() => import('./pages/candidate/JobSearch'))
const JobDetails = React.lazy(() => import('./pages/candidate/JobDetails'))
const ApplyJob = React.lazy(() => import('./pages/candidate/ApplyJob'))
const MyApplications = React.lazy(() => import('./pages/candidate/MyApplications'))
const SavedJobs = React.lazy(() => import('./pages/candidate/SavedJobs'))
const CandidateSummary = React.lazy(() => import('./pages/candidate/CandidateSummary'))
import CandidateLayout from './components/candidate/dashboard/CandidateLayout'
import { CandidateDashboardProvider } from './context/CandidateDashboardContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
const Home = React.lazy(() => import('./pages/Home'))
const About = React.lazy(() => import('./pages/About'))
const HowItWorks = React.lazy(() => import('./pages/HowItWorks'))
const Contact = React.lazy(() => import('./pages/Contact'))
const Faq = React.lazy(() => import('./pages/Faq'))
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'))
const Pricing = React.lazy(() => import('./pages/Pricing'))
const FindJobs = React.lazy(() => import('./pages/FindJobs'))
const ForRecruiters = React.lazy(() => import('./pages/ForRecruiters'))
const GetStarted = React.lazy(() => import('./pages/GetStarted'))
const FrontendPrototype = React.lazy(() => import('./pages/FrontendPrototype'))
const RegisterCandidate = React.lazy(() => import('./pages/RegisterCandidate'))
const RegisterRecruiter = React.lazy(() => import('./pages/RegisterRecruiter'))
const Login = React.lazy(() => import('./pages/Login'))
const AcceptRecruiterInvitation = React.lazy(() => import('./pages/AcceptRecruiterInvitation'))
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'))
const EmailVerification = React.lazy(() => import('./pages/EmailVerification'))
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'))
const PasswordResetSuccess = React.lazy(() => import('./pages/PasswordResetSuccess'))
const RecruiterVerificationPending = React.lazy(() => import('./pages/recruiter/RecruiterVerificationPending'))
import RequireRecruiterAccess from './components/recruiter/RequireRecruiterAccess'
import RequireCandidateAccess from './components/candidate/RequireCandidateAccess'
import { getAuthenticatedUser } from './lib/authSession'
const RecruiterDashboard = React.lazy(() => import('./pages/recruiter/RecruiterDashboard'))
const RecruiterJobs = React.lazy(() => import('./pages/recruiter/RecruiterJobs'))
const RecruiterTeam = React.lazy(() => import('./pages/recruiter/RecruiterTeam'))
const AccountSecurity = React.lazy(() => import('./pages/AccountSecurity'))
const RecruiterJobApplicants = React.lazy(() => import('./pages/recruiter/RecruiterJobApplicants'))
const RecruiterCandidateProfile = React.lazy(() => import('./pages/recruiter/RecruiterCandidateProfile'))
const RecruiterPurchasedCandidates = React.lazy(() => import('./pages/recruiter/RecruiterPurchasedCandidates'))
const RecruiterShortlistedCandidates = React.lazy(() => import('./pages/recruiter/RecruiterShortlistedCandidates'))
const RecruiterApplicationsByStatus = React.lazy(() => import('./pages/recruiter/RecruiterApplicationsByStatus'))
const RecruiterPlansCredits = React.lazy(() => import('./pages/recruiter/RecruiterPlansCredits'))
const RecruiterCheckout = React.lazy(() => import('./pages/recruiter/RecruiterCheckout'))
const RecruiterPaymentSuccess = React.lazy(() => import('./pages/recruiter/RecruiterPaymentSuccess'))
const RecruiterPaymentFailed = React.lazy(() => import('./pages/recruiter/RecruiterPaymentFailed'))
const RecruiterPaymentHistory = React.lazy(() => import('./pages/recruiter/RecruiterPaymentHistory'))
const RecruiterInvoice = React.lazy(() => import('./pages/recruiter/RecruiterInvoice'))
const RecruiterHospitalProfile = React.lazy(() => import('./pages/recruiter/RecruiterHospitalProfile'))
import RecruiterLayout from './components/recruiter/dashboard/RecruiterLayout'

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

function AccountSecurityRedirect() {
  const user = getAuthenticatedUser()
  const role = String(user?.role || user?.userType || '').toLowerCase()
  if (role === 'candidate') return <Navigate to="/candidate/account-security" replace />
  if (role === 'recruiter') return <Navigate to="/recruiter/account-security" replace />
  return <Navigate to="/login" replace />
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <React.Suspense fallback={<div role="status" className="min-h-[40vh] p-6 text-sm text-slate-500">Loading screen…</div>}>
      <Routes>
      <Route path="/candidate" element={<RequireCandidateAccess><CandidateProfileProvider><Outlet /></CandidateProfileProvider></RequireCandidateAccess>}>
        <Route index element={<Navigate to="profile/resume" replace />} />
        <Route path="profile/resume" element={<ResumeUpload />} />
        <Route path="profile/personal" element={<PersonalInformation />} />
        <Route path="profile/professional" element={<ProfessionalInformation />} />
        <Route path="profile/education" element={<Education />} />
        <Route path="profile/work-experience" element={<WorkExperience />} />
        <Route path="profile/skills" element={<Skills />} />
        <Route path="profile/certifications" element={<Certifications />} />
        <Route path="profile/career-preferences" element={<CareerPreferences />} />
        <Route path="profile/complete" element={<ProfileSetupComplete />} />
        <Route element={<CandidateDashboardProvider><CandidateLayout /></CandidateDashboardProvider>}>
          <Route path="dashboard" element={<CandidateDashboard />} />
          <Route path="profile" element={<MyProfile />} />
          <Route path="edit-profile" element={<EditProfile />} />
          <Route path="resume-management" element={<ResumeManagement />} />
          <Route path="privacy-settings" element={<PrivacySettings />} />
          <Route path="account-security" element={<AccountSecurity />} />
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
      <Route path="/prototype" element={<FrontendPrototype />} />
      <Route path="/register/candidate" element={<RegisterCandidate />} />
      <Route path="/register/recruiter" element={<RegisterRecruiter />} />
      <Route path="/login" element={<Login />} />
      <Route path="/accept-invitation" element={<AcceptRecruiterInvitation />} />
      <Route path="/recruiter/login" element={<Navigate to="/login?role=recruiter" replace />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email" element={<EmailVerification />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/account/security" element={<AccountSecurityRedirect />} />
      <Route path="/password-reset-success" element={<PasswordResetSuccess />} />

      <Route path="/recruiter/verification-pending" element={<RequireRecruiterAccess allowPending><RecruiterVerificationPending /></RequireRecruiterAccess>} />
      <Route path="/recruiter" element={<RequireRecruiterAccess><RecruiterLayout /></RequireRecruiterAccess>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<RecruiterDashboard />} />
        <Route path="jobs" element={<RecruiterJobs />} />
        <Route path="team" element={<RecruiterTeam />} />
        <Route path="jobs/:jobId/applications" element={<RecruiterJobApplicants />} />
        <Route path="find-candidates" element={<Navigate to="/recruiter/dashboard" replace />} />
        <Route path="purchased-candidates" element={<RecruiterPurchasedCandidates />} />
        <Route path="shortlisted-candidates" element={<RecruiterShortlistedCandidates />} />
        <Route path="applications/under-review" element={<RecruiterApplicationsByStatus status="UNDER_REVIEW" />} />
        <Route path="applications/interview" element={<RecruiterApplicationsByStatus status="INTERVIEW" />} />
        <Route path="applications/hired" element={<RecruiterApplicationsByStatus status="HIRED" />} />
        <Route path="applications/rejected" element={<RecruiterApplicationsByStatus status="REJECTED" />} />
        <Route path="plans-credits" element={<RecruiterPlansCredits />} />
        <Route path="plans-credits/checkout" element={<RecruiterCheckout />} />
        <Route path="payment-success" element={<RecruiterPaymentSuccess />} />
        <Route path="payment-failed" element={<RecruiterPaymentFailed />} />
        <Route path="payment-history" element={<RecruiterPaymentHistory />} />
        <Route path="payment-history/invoices/:transactionId" element={<RecruiterInvoice />} />
        <Route path="hospital-profile" element={<RecruiterHospitalProfile />} />
        <Route path="account-security" element={<AccountSecurity />} />
        <Route path="candidates/:candidateId" element={<RecruiterCandidateProfile />} />
        <Route path="candidates/:candidateId/unlocked" element={<RecruiterCandidateProfile />} />
      </Route>

      {/* Standard site pages */}
      <Route path="/" element={<SiteLayout><Home /></SiteLayout>} />
      <Route path="/about" element={<SiteLayout><About /></SiteLayout>} />
      <Route path="/how-it-works" element={<SiteLayout><HowItWorks /></SiteLayout>} />
      <Route path="/contact" element={<SiteLayout><Contact /></SiteLayout>} />
      <Route path="/faq" element={<SiteLayout><Faq /></SiteLayout>} />
      <Route path="/privacy-policy" element={<SiteLayout><PrivacyPolicy /></SiteLayout>} />
      <Route path="/terms-of-service" element={<SiteLayout><TermsOfService /></SiteLayout>} />
      <Route path="/find-jobs" element={<SiteLayout><FindJobs /></SiteLayout>} />
      <Route path="/for-recruiters" element={<SiteLayout><ForRecruiters /></SiteLayout>} />
      <Route path="/pricing" element={<SiteLayout><Pricing /></SiteLayout>} />
      </Routes>
      </React.Suspense>
    </>
  )
}
