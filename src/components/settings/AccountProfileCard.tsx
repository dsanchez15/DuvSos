'use client'

import SettingCard from '@/components/SettingCard'
import { Input, Textarea } from '@/components/ui'
import { useAppTranslation } from '@/components/LanguageProvider'

export interface SettingsUser {
  name?: string
  email?: string
  tagline?: string
  image?: string
}

interface AccountProfileCardProps {
  user: SettingsUser | null
  onUserChange: (user: SettingsUser) => void
}

export default function AccountProfileCard({ user, onUserChange }: AccountProfileCardProps) {
  const { t } = useAppTranslation()

  const update = (patch: Partial<SettingsUser>) => onUserChange({ ...(user ?? {}), ...patch })

  return (
    <SettingCard>
      <div className="mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">person</span>
        <h2 className="text-lg font-semibold">{t('settings.accountProfile')}</h2>
      </div>
      <div className="flex flex-col items-start gap-8 md:flex-row">
        <div className="group relative">
          <img
            alt="Avatar"
            className="h-24 w-24 rounded-full object-cover ring-4 ring-primary/20"
            src={
              user?.image ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`
            }
          />
          <button className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <span className="material-symbols-outlined text-white">photo_camera</span>
          </button>
        </div>
        <div className="grid w-full flex-1 grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label={t('settings.fullName')}
            value={user?.name || ''}
            onChange={(e) => update({ name: e.target.value })}
          />
          <Input
            label={t('settings.emailAddress')}
            type="email"
            value={user?.email || ''}
            onChange={(e) => update({ email: e.target.value })}
          />
          <div className="md:col-span-2">
            <Textarea
              label={t('settings.bioTagline')}
              rows={3}
              className="resize-none"
              value={user?.tagline || ''}
              onChange={(e) => update({ tagline: e.target.value })}
            />
          </div>
        </div>
      </div>
    </SettingCard>
  )
}
