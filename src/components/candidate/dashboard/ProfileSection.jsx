import React from 'react'
export default function ProfileSection({ title, children, className = '' }) { return <section className={`med-card ${className}`}><h2 className="med-heading-3 mb-3">{title}</h2>{children}</section> }
