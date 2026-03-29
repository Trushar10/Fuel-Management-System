'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fuel, LayoutDashboard, Table2, PlusCircle, Database, IndianRupee } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  const linkClass = (href) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      pathname === href
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Fuel className="h-7 w-7 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Fuel Manager</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" className={linkClass('/')}>
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/entries" className={linkClass('/entries')}>
              <Table2 className="h-4 w-4" />
              Entries
            </Link>
            <Link href="/add" className={linkClass('/add')}>
              <PlusCircle className="h-4 w-4" />
              Add Entry
            </Link>
            <Link href="/master-data" className={linkClass('/master-data')}>
              <Database className="h-4 w-4" />
              Master Data
            </Link>
            <Link href="/creditor-records" className={linkClass('/creditor-records')}>
              <IndianRupee className="h-4 w-4" />
              Creditor Records
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
