import React from 'react'

const assets = import.meta.glob('../../../assets/candidate/*.svg', { eager: true, query: '?url', import: 'default' })
export const candidateAsset = (name) => assets[`../../../assets/candidate/${name}.svg`]
export default function CandidateIcon({ name, className = 'h-5 w-5' }) {
  const url = candidateAsset(name)
  return <span aria-hidden="true" className={`inline-block shrink-0 bg-current ${className}`} style={{ maskImage: `url("${url}")`, WebkitMaskImage: `url("${url}")`, maskRepeat: 'no-repeat', maskPosition: 'center', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center', WebkitMaskSize: 'contain' }} />
}
