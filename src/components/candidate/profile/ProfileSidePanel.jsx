import React from 'react'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import teamImage from '../../../assets/hero-doctor-nurse.png'
import hallwayImage from '../../../assets/candidate-tablet-hallway.png'
import hospitalImage from '../../../assets/hospital-lobby.png'

const images = [teamImage, hallwayImage, hospitalImage, hospitalImage, teamImage, hallwayImage, teamImage, hallwayImage, hallwayImage]
export default function ProfileSidePanel({ step }) {
  return <aside className="relative hidden min-h-screen overflow-hidden bg-ink-900 lg:block">
    <img src={images[step - 1]} alt="" className="absolute inset-0 h-full w-full object-cover" />
    <div className="absolute inset-0 bg-slate-900/65" />
    <div className="sticky top-0 flex h-screen flex-col justify-between p-10 xl:p-12">
      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white"><LockKeyhole size={13} />Secure professional profile</span>
      <div className="pb-2 text-white"><h2 className="max-w-md text-3xl font-extrabold leading-tight xl:text-4xl">Build a profile that opens the right doors.</h2><p className="mt-4 max-w-md text-sm leading-relaxed text-slate-200">Help leading healthcare organizations discover your expertise, credentials, and unique experience.</p><p className="mt-5 flex items-center gap-2 text-xs"><ShieldCheck size={15} className="text-accent-500" />HIPAA-conscious · Enterprise secure</p></div>
    </div>
  </aside>
}
