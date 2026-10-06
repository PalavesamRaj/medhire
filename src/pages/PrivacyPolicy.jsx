import React from 'react'
import { Check } from 'lucide-react'
import LegalLayout from '../components/ui/LegalLayout'

function CheckList({ items }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

const sections = [
  {
    id: 'introduction',
    title: 'Introduction',
    content: (
      <p>
        MedHire ("we", "us", "our") operates a healthcare recruitment marketplace platform. This
        Privacy Policy describes how we collect, use, store, and protect personal information
        from healthcare professionals ("Candidates"), hospitals and recruitment agencies
        ("Recruiters"), and visitors to our platform.
      </p>
    ),
  },
  {
    id: 'information-we-collect',
    title: 'Information We Collect',
    content: (
      <p>
        We collect information that you provide directly, information collected automatically,
        and information from third parties. This includes registration data, professional
        credentials, usage analytics, and payment information.
      </p>
    ),
  },
  {
    id: 'candidate-profile-information',
    title: 'Candidate Profile Information',
    content: (
      <>
        <p>
          When healthcare professionals create a profile, we collect details to establish their
          active clinical eligibility. This categorization ensures clear divisions of candidate
          privacy control:
        </p>
        <CheckList
          items={[
            <>
              <strong className="text-ink-900">Public Preview Information:</strong> Healthcare
              specialty, sub-specialty, active board certification designations, city level
              location, and cumulative years of experience.
            </>,
            <>
              <strong className="text-ink-900">Protected Information:</strong> Full legal name,
              phone number, email address, specific hospital references, and active registry
              registration IDs.
            </>,
          ]}
        />
      </>
    ),
  },
  {
    id: 'resume-data',
    title: 'Resume Data',
    content: (
      <p>
        Resumes uploaded to MedHire are stored securely and classified as Protected Information.
        Resume files are encrypted at rest and in transit. Resume access is granted only to
        verified recruiters who use credits to unlock a candidate profile. Candidates may delete
        their resume at any time.
      </p>
    ),
  },
  {
    id: 'how-information-is-used',
    title: 'How Information Is Used',
    content: (
      <>
        <p>
          We use collected information to run our secure clinical matching platform effectively,
          keeping candidate security at the core of our operations:
        </p>
        <CheckList
          items={[
            'Verify clinical state licensure records directly against official government registries.',
            'Optimize automated match indexing algorithms to fit recruiter requirements.',
            'Safely process recruiter credit balance purchases and micro-transactions securely.',
            'Enforce strict enterprise compliance against unverified candidate scraping behaviors.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'candidate-profile-visibility',
    title: 'Candidate Profile Visibility',
    content: (
      <p>
        Candidate profiles are displayed to verified recruiters in a masked format by default.
        Public Preview Information includes: healthcare specialty, years of experience,
        certification types, general location (city level), and qualification highlights. Masked
        Information includes: full name (displayed as initials), phone number (partially hidden),
        email address (partially hidden), and detailed work history.
      </p>
    ),
  },
  {
    id: 'verified-recruiter-access',
    title: 'Verified Recruiter Access',
    content: (
      <p>
        Only recruiters who have completed organization verification can search candidate
        profiles. Verification includes validating the recruiter's hospital or agency
        registration, confirming authorized hiring representatives, and agreeing to data usage
        terms. Unverified accounts cannot access any candidate information.
      </p>
    ),
  },
  {
    id: 'resume-contact-access',
    title: 'Resume & Contact Access',
    content: (
      <p>
        Full candidate contact information and resume access requires a credit-based unlock. When
        a recruiter unlocks a candidate profile: the recruiter gains access to the candidate's
        full name, phone number, email address, and downloadable resume. The candidate is
        notified that their profile has been unlocked. The unlock is logged for audit and
        compliance purposes.
      </p>
    ),
  },
  {
    id: 'payments',
    title: 'Payments',
    content: (
      <p>
        Payment information for recruiter credit purchases is processed through secure
        third-party payment processors. We do not store complete credit card numbers on our
        servers. Transaction records are maintained for billing, refund processing, and
        regulatory compliance.
      </p>
    ),
  },
  {
    id: 'data-security',
    title: 'Data Security',
    content: (
      <p>
        We implement industry-standard security measures including: TLS encryption for all data
        in transit, AES-256 encryption for sensitive data at rest, role-based access controls,
        regular security audits and penetration testing, automated threat detection and
        monitoring, and secure data center infrastructure.
      </p>
    ),
  },
  {
    id: 'data-retention',
    title: 'Data Retention',
    content: (
      <p>
        Active account data is retained for the duration of the account. Deleted account data is
        permanently removed within 30 days. Payment records are retained for 7 years per
        regulatory requirements. Anonymized analytics data may be retained indefinitely.
      </p>
    ),
  },
  {
    id: 'user-rights',
    title: 'User Rights',
    content: (
      <>
        <p>
          You have control over how your data is processed. These platform mechanisms support
          candidate data ownership rights:
        </p>
        <CheckList
          items={[
            'Right to easily correct, update, or edit clinical credential entries directly from your settings.',
            'Right to initiate direct deletion requests for your active profile and uploaded certificates.',
            'Right to request structural port exports of your personal files in standardized CSV layouts.',
            'Right to toggle clinical visibility status instantly, opting out of recruiter marketplace search.',
          ]}
        />
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies',
    content: (
      <p>
        We use essential cookies for platform functionality, analytics cookies to improve user
        experience, and optional marketing cookies with your consent. You can manage cookie
        preferences through your browser settings or our cookie management tool.
      </p>
    ),
  },
  {
    id: 'policy-updates',
    title: 'Policy Updates',
    content: (
      <p>
        We may update this Privacy Policy periodically. Material changes will be communicated via
        email notification and prominent platform notice. Continued use after changes constitutes
        acceptance.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    content: (
      <>
        <p>
          For privacy-related inquiries or HIPAA audit questions, please connect directly with
          our compliance representatives:
        </p>
        <div className="rounded-lg bg-ink-50 p-5">
          <p className="font-semibold text-ink-900">Privacy Officer</p>
          <p>MedHire Technologies Pvt. Ltd.</p>
          <p>Email: privacy@medhire.com</p>
          <p>Address: [Registered Office Address]</p>
          <p>Phone: +91 98765 43210</p>
        </div>
      </>
    ),
  },
]

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      updated="September 1, 2026"
      title="Privacy Policy"
      intro="This policy explains how MedHire collects, uses, and protects your personal information. We are committed to maintaining clinical recruitment trust and HIPAA-grade confidentiality."
      sections={sections}
    />
  )
}
