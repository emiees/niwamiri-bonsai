import { NavLink } from 'react-router-dom'
import { TreePine, Calendar, ScanSearch, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/',          icon: TreePine,   labelKey: 'nav.inventory' },
  { to: '/calendar',  icon: Calendar,   labelKey: 'nav.calendar'  },
  { to: '/identify',  icon: ScanSearch, labelKey: 'nav.identify'  },
  { to: '/settings',  icon: Settings,   labelKey: 'nav.settings'  },
] as const

export default function BottomNav() {
  const { t } = useTranslation()

  return (
    <nav
      style={{
        background: 'var(--nav)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      className="fixed bottom-0 left-0 right-0 z-50 flex"
    >
      {NAV_ITEMS.map(({ to, icon: Icon, labelKey }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
              isActive
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--text3)] hover:text-[var(--text2)]'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.7}
                className="transition-transform duration-150 active:scale-90"
              />
              <span>{t(labelKey)}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
