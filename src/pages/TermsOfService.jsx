import React from 'react'
import LegalLayout from '../components/ui/LegalLayout'

const sections = [
  {
    id: 'acceptance-of-terms',
    title: 'Acceptance of Terms',
    content: (
      <>
        <p>
          By accessing, downloading, installing, or using the MedHire platform (collectively, the
          'Service'), you agree to be bound by these Terms of Service. These terms constitute a
          legally binding agreement between you and MedHire Technologies Pvt. Ltd. ('MedHire',
          'we', 'us', or 'our').
        </p>
        <p>
          These terms apply comprehensively to all visitors, healthcare professionals seeking
          clinical employment opportunities ('Candidates'), hospitals, healthcare institutions,
          and recruitment agencies seeking to hire clinical professionals ('Recruiters'), and any
          others who access or use the Service.
        </p>
      </>
    ),
  },
  {
    id: 'platform-description',
    title: 'Platform Description',
    content: (
      <>
        <p>
          MedHire provides a secure, digital SaaS-powered recruitment ecosystem connecting
          verified clinical and healthcare professionals with authorized medical organizations.
        </p>
        <p>
          The Service facilitates the verification of national licenses, certifications, clinical
          experience, and board registrations. Candidate details are securely mapped, masked
          initially to protect clinical privacy, and unlocked by qualified institutions through
          our proprietary credit system. MedHire provides digital matching pipelines, and
          interactive analytics dashboards.
        </p>
      </>
    ),
  },
  {
    id: 'user-accounts',
    title: 'User Accounts',
    content: (
      <>
        <p>
          To utilize most facets of the MedHire platform, you must establish an authorized user
          account. You represent and warrant that all registration data provided is accurate,
          current, and true. You are solely responsible for maintaining the strict confidentiality
          of your credential, password, and account login tokens.
        </p>
        <p>
          Only one account may be registered per clinical professional or recruiter role. MedHire
          reserves the explicit right to suspend, terminate, or refuse access to accounts at our
          sole discretion, especially those suspected of utilizing false identities or violating
          platform verification metrics.
        </p>
      </>
    ),
  },
  {
    id: 'candidate-terms',
    title: 'Candidate Terms',
    content: (
      <>
        <p>
          By registering as a Candidate on MedHire, you explicitly represent that you hold a
          valid, active license to practice your clinical specialty, free of unresolved
          disciplinary actions or regulatory restrictions.
        </p>
        <p>
          You certify that all clinical histories, resumes, certifications (including but not
          limited to ACLS, BLS, and board certifications) are fully authentic. You authorize
          MedHire to run verification checks with various State Medical Registries and national
          databases. You understand that your profile metadata, masked securely, will be
          displayed to authenticated hospital networks and recruiter pools.
        </p>
      </>
    ),
  },
  {
    id: 'recruiter-terms',
    title: 'Recruiter Terms',
    content: (
      <>
        <p>
          By utilizing the Service as a Recruiter, you represent and warrant that you are an
          authorized hiring representative of a legitimate, active medical facility or certified
          recruitment agency.
        </p>
        <p>
          You agree to use any unlocked candidate profiles, clinical resumes, and direct contact
          details exclusively for legitimate clinical recruitment activities within your
          specified organization. Circumventing the platform or sharing unlocked details with
          external third parties is strictly prohibited.
        </p>
      </>
    ),
  },
  {
    id: 'credit-system',
    title: 'Credit System',
    content: (
      <p>
        The MedHire recruiter marketplace functions via a credit-based access model. Recruiters
        purchase credit bundles to unlock detailed, unmasked candidate profiles. Credits purchased
        on MedHire are non-refundable except in documented instances of technical system error
        verified by our operations team. Credits do not expire as long as your organizational
        account remains active and in good standing. Subscription plans auto-renew monthly or
        annually depending on selection unless written cancellation is provided prior to the
        renewal cycle. All pricing metrics are specified and billed in Indian Rupees (INR).
      </p>
    ),
  },
  {
    id: 'candidate-unlocking',
    title: 'Candidate Unlocking',
    content: (
      <>
        <p>
          When a Recruiter elects to unlock a candidate's profile, the corresponding credit cost
          is immediately deducted from the organization's credit balance.
        </p>
        <p>
          Once unlocked, the Recruiter gains permanent access to the candidate's full legal name,
          certified resume documents, unmasked registry details, and verified contact channels.
          The candidate is automatically notified of the unlock event. Unlocked access is
          non-transferable and remains permanently tied to that recruiter's specific
          organizational division.
        </p>
      </>
    ),
  },
  {
    id: 'content-and-ip',
    title: 'Content and IP',
    content: (
      <>
        <p>
          All intellectual property, proprietary software code, logo assets, interface styles,
          system grids, and data structures of the Service are the exclusive property of MedHire
          Technologies Pvt. Ltd. and its licensors.
        </p>
        <p>
          While users retain basic ownership of the clinical resumes, personal profile copy, and
          institutional logos they submit, you grant MedHire a worldwide, royalty-free, perpetual
          license to securely host, display, aggregate, and process your content within the
          platform ecosystem to execute the Service.
        </p>
      </>
    ),
  },
  {
    id: 'prohibited-conduct',
    title: 'Prohibited Conduct',
    content: (
      <p>
        Users agree to utilize the platform with strict professional ethics. Prohibited actions
        include: providing falsified medical or institutional registration data; scraping
        candidate indices via automated script tools; sharing unlocked clinical contact details
        with unapproved third parties; trying to bypass credit models; and using the platform for
        unsolicited advertising or non-recruitment campaigns.
      </p>
    ),
  },
  {
    id: 'privacy',
    title: 'Privacy',
    content: (
      <p>
        Our practices regarding the collection, processing, encryption, and protection of your
        personal and clinical data are comprehensively outlined in our Privacy Policy, which is
        explicitly incorporated by reference into these Terms of Service.
      </p>
    ),
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    content: (
      <>
        <p>
          The MedHire Service is provided 'as is' and 'as available' without warranties of any
          kind. While our team performs direct licensing registry checks, we do not guarantee the
          ultimate professional competence of candidates, or the specific hiring outcomes of
          recruiters.
        </p>
        <p>
          We do not warrant that platform systems, verification links, or communication dashboards
          will remain completely uninterrupted or free of unexpected technical failures.
        </p>
      </>
    ),
  },
  {
    id: 'limitation-of-liability',
    title: 'Limitation of Liability',
    content: (
      <>
        <p>
          In no event shall MedHire, its directors, officers, employees, or tech partners be
          liable for any indirect, incidental, special, or consequential damages resulting from
          clinical placements, hiring decisions, or platform downtime.
        </p>
        <p>
          MedHire's total aggregate liability for all claims arising under these terms is strictly
          capped at the total financial fees paid by you to MedHire during the twelve-month period
          immediately preceding the date of the claim.
        </p>
      </>
    ),
  },
  {
    id: 'termination',
    title: 'Termination',
    content: (
      <>
        <p>
          MedHire reserves the right, without prior warning, to temporarily suspend or permanently
          terminate your account and platform access if we determine you are in violation of these
          Terms of Service, or engaged in conduct detrimental to the clinical community.
        </p>
        <p>
          Upon termination, your rights to access the marketplace, candidate databases, and active
          credit sheets cease immediately. Data deletion is managed securely per the guidelines of
          our Privacy Policy.
        </p>
      </>
    ),
  },
  {
    id: 'dispute-resolution',
    title: 'Dispute Resolution',
    content: (
      <>
        <p>
          These Terms of Service shall be governed by, construed, and enforced in accordance with
          the laws of India.
        </p>
        <p>
          Any disputes, controversies, or legal claims arising out of or relating to these terms
          shall be subject to the exclusive jurisdiction of courts located in Mumbai, India, and
          resolved through binding professional arbitration conducted in Mumbai.
        </p>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    content: (
      <>
        <p>
          If you have inquiries, clarifications, or require legal assistance regarding these
          Terms of Service, please contact our Legal Department:
        </p>
        <div className="rounded-lg bg-ink-50 p-5">
          <p className="font-semibold text-ink-900">Legal Department, MedHire Technologies Pvt. Ltd.</p>
          <p>Email: legal@medhire.com</p>
          <p>Phone: +91 98765 43210</p>
        </div>
      </>
    ),
  },
]

export default function TermsOfService() {
  return (
    <LegalLayout
      eyebrow="Legal Document"
      title="Terms of Service"
      updatedLine="Last updated: September 1, 2026"
      sections={sections}
    />
  )
}
