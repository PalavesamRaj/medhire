import React from 'react'
export default function PageHeading({ title, subtitle, children }) { return <header className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="med-display-sm">{title}</h1>{subtitle && <p className="med-body mt-2 text-ink-600">{subtitle}</p>}</div>{children}</header> }
