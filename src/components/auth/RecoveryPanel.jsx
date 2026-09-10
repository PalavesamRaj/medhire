import React from 'react'
import { Check } from 'lucide-react'
import Logo from '../layout/Logo'

const points = [
  'Secure account recovery',
  'Your privacy is always protected',
  'Trusted by healthcare professionals',
]

export default function RecoveryPanel({ image, imageAlt }) {
  return (
    <aside className="hidden w-[40%] flex-col justify-between overflow-hidden bg-brand-900 px-12 pt-16 lg:flex">
      <div>
        <Logo light />
        <h2 className="mt-8 max-w-sm text-[28px] font-extrabold leading-tight text-white">
          Your Healthcare Career Awaits
        </h2>
        <ul className="mt-6 flex flex-col gap-3">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-3 text-sm text-brand-100">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                <Check className="h-3 w-3 text-white" />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-8 overflow-hidden">
        <img src={image} alt={imageAlt} className="h-[246px] w-full rounded-t-xl rounded-b-none object-cover object-top" />
      </div>
    </aside>
  )
}
