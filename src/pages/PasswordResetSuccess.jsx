import React from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import AuthSplitLayout from '../components/auth/AuthSplitLayout'
import Button from '../components/ui/Button'
import panelImage from '../assets/security-shields.png'

export default function PasswordResetSuccess() {
  return (
    <AuthSplitLayout
      formTitle="Password Reset Successful"
      formSubtitle="Your password has been updated successfully."
      panelTitle="Welcome Back to MedHire"
      panelPoints={[
        'Sign in with your new password',
        'Continue connecting with trusted healthcare teams',
        'Your account remains protected at every step',
      ]}
      panelImage={panelImage}
      panelImageAlt="Security and compliance"
    >
      <div className="flex flex-col items-center gap-5 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-50 text-accent-700">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <p className="text-sm text-ink-500">
          Your new password is ready. You can now securely log in to your account.
        </p>
        <Link to="/login" className="w-full">
          <Button className="w-full justify-center">Continue to Login</Button>
        </Link>
      </div>
    </AuthSplitLayout>
  )
}