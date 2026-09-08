import React from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import Logo from '../layout/Logo'

export default function AuthSplitLayout({
  formTitle,
  formSubtitle,
  children,
  panelTitle,
  panelPoints,
  panelImage,
  panelImageAlt,
  panelImageClassName = 'h-72 object-top',
  panelImageAtBottom = false,
  panelFooter,
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link to="/">
            <Logo />
          </Link>
          <h1 className="mt-8 text-2xl font-extrabold text-ink-900 sm:text-3xl">{formTitle}</h1>
          {formSubtitle && <p className="mt-2 text-sm text-ink-500">{formSubtitle}</p>}

          <div className="mt-8">{children}</div>
        </div>
      </div>

      <div
        className={`relative hidden flex-col justify-between overflow-hidden bg-brand-900 px-12 py-12 lg:flex ${
          panelImageAtBottom ? 'pb-0' : ''
        }`}
      >
        <div>
          <Logo light />
          <h2 className="mt-8 max-w-sm text-3xl font-extrabold leading-tight text-white">
            {panelTitle}
          </h2>
          <ul className="mt-6 flex flex-col gap-3">
            {panelPoints.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-brand-100">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Check className="h-3 w-3 text-white" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        {panelImage && (
          <div className="mt-8 overflow-hidden rounded-xl">
            <img src={panelImage} alt={panelImageAlt} className={`w-full object-cover ${panelImageClassName}`} />
          </div>
        )}

        {panelFooter && <p className="mt-6 text-xs text-brand-200">{panelFooter}</p>}
      </div>
    </div>
  )
}
