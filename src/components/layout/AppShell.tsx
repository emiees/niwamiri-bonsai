import { cn } from '@/lib/utils'
import BottomNav from './BottomNav'

interface AppShellProps {
  children: React.ReactNode
  /**
   * Whether to show the bottom navigation bar.
   * True for top-level pages (Inventory, Calendar, Identify, Settings).
   * False for sub-pages (BonsaiDetail, CareForm, Gallery, etc.)
   */
  showNav?: boolean
  className?: string
}

/**
 * AppShell — root layout wrapper.
 *
 * Layout layers (bottom → top on z-axis):
 *   - Fixed Header (rendered by each page via the Header component)
 *   - Scrollable main content area (pt-14 to clear Header, pb-20 to clear BottomNav)
 *   - Fixed BottomNav (optional)
 */
export default function AppShell({ children, showNav = true, className }: AppShellProps) {
  return (
    <div
      className="relative min-h-screen"
      style={{ background: 'var(--bg)', color: 'var(--text1)' }}
    >
      {/* Main scrollable content */}
      <main
        className={cn(
          'min-h-screen overflow-y-auto',
          showNav ? 'pb-20' : 'pb-4', // clear BottomNav or add minimal padding
          className
        )}
        style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top))' }}
      >
        {children}
      </main>

      {showNav && <BottomNav />}
    </div>
  )
}
