import React from 'react'
import stethoscopeIcon from '../../assets/logo-stethoscope.png'

/**
 * icon-stethoscope
 * Auto layout: column, centered, 0px padding, 24x24, flex: none, grow: 0
 */
export default function Logo({ light = false }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 flex-none grow-0 flex-col items-center justify-center p-0 order-0">
        <img src={stethoscopeIcon} alt="MedHire" className="h-6 w-6 object-contain" />
      </span>
      <span className={`text-lg font-bold ${light ? 'text-white' : 'text-ink-900'}`}>MedHire</span>
    </div>
  )
}
