import React from 'react'
import Badge from '../../ui/Badge'
const tones = { 'Open to Work': 'success', Approved: 'success', 'Resume Approved': 'blue', Active: 'blue', Archived: 'slate', Rejected: 'error', 'Pending Review': 'warning', Applied: 'blue', 'Under Review': 'blue', Shortlisted: 'success', Interview: 'teal', Hired: 'success', 'Full-time': 'blue', 'Part-time': 'blue', Contract: 'teal', 'Per Diem': 'slate' }
export default function StatusBadge({ status }) { return <Badge tone={tones[status] || 'slate'} className="med-caption !font-semibold !normal-case !tracking-normal">{status === 'Open to Work' && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-green-600" />}{status}</Badge> }
