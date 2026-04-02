'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/', label: 'Dashboard', icon: '📊', group: 'Main' },
  { href: '/add', label: 'Trip Entry', icon: '🚛', group: 'Main' },
  { href: '/mobile-refueling', label: 'Mobile Refueling', icon: '🛢️', group: 'Main' },
  { href: '/purchase', label: 'Purchase', icon: '⛽', group: 'Main' },
  { href: '/mru-entries', label: 'MRU Entries', icon: '📋', group: 'Main' },
  { href: '/creditor-records', label: 'Creditor Records', icon: '🏦', group: 'Main' },
  { href: '/entries', label: 'All Entries', icon: '📋', group: 'Finance' },
  { href: '/master-data', label: 'Master Data', icon: '⚙️', group: 'Setup' },
];

export default function Navbar() {
  const pathname = usePathname();
  const isActive = (href) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  let lastGroup = '';

  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-mark">
          <div className="logo-icon">⛽</div>
          <div className="logo-text">Fuel<span>Core</span></div>
        </div>
        <div className="logo-sub">Fleet Management v2.4</div>
      </div>

      <nav>
        {NAV_LINKS.map(({ href, label, icon, group }) => {
          const showLabel = group !== lastGroup;
          lastGroup = group;
          return (
            <div key={href}>
              {showLabel && <div className="nav-label">{group}</div>}
              <Link href={href} className={`nav-item ${isActive(href) ? 'active' : ''}`}>
                <span className="nav-icon">{icon}</span> {label}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="avatar">FM</div>
          <div className="user-info">
            <div className="user-name">Fleet Manager</div>
            <div className="user-role">Administrator</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
