'use client';

import Link from 'next/link';
import { useClient } from '@/lib/supabase-browser';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface SidebarProps {
  userRole: string | null;
}

export function Sidebar({ userRole }: SidebarProps) {
  const [open, setOpen] = useState(true);
  const [role, setRole] = useState<string | null>(userRole);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useClient();

  const resolvedRole = useMemo(() => userRole, [userRole]);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (resolvedRole) return; // Already have role from props or previous fetch
      
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setRole(profile?.role ?? null);
      } else {
        setRole(null);
      }
    };

    fetchUserRole();
  }, [supabase, resolvedRole]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const getMenuItems = () => {
    const roleToUse = resolvedRole ?? role;
    if (!roleToUse) return [];

    const commonItems = [
      { href: `/dashboard/${roleToUse === 'super_admin' ? 'admin' : roleToUse}`, label: 'Dashboard', icon: '' },
    ];

    if (roleToUse === 'super_admin') {
      return [
        ...commonItems,
      ];
    }

    if (roleToUse === 'faculty') {
      return [
        ...commonItems,
        { href: '/dashboard/faculty/history', label: 'Approval History', icon: '' },
      ];
    }

    if (roleToUse === 'student') {
      return [
        ...commonItems,
        { href: '/dashboard/student/history', label: 'My Requests', icon: '' },
      ];
    }

    return [];
  };

  if (!open) {
    return (
      <aside className="flex h-screen flex-col w-16 bg-white border-r border-blue-100 transition-all duration-300">
        <div className="flex h-16 items-center justify-center border-b border-blue-100">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-md hover:bg-blue-50 text-blue-600"
            aria-label="Toggle sidebar"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-screen flex-col w-64 bg-white border-r border-blue-100 transition-all duration-300">
      <div className="flex h-16 items-center justify-between px-4 border-b border-blue-100">
        <h1 className="text-xl font-bold truncate bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Acharya Attendance System</h1>
        <button
          onClick={() => setOpen(false)}
          className="p-2 rounded-md hover:bg-blue-50 text-blue-600"
          aria-label="Toggle sidebar"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {getMenuItems().map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              pathname === item.href
                ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600 ml-0 pl-[10px]'
                : 'text-gray-600 hover:bg-blue-50/50 hover:text-blue-600 ml-0.5 pl-[10.5px] border-l-2 border-transparent'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-blue-100">
        <button
          onClick={handleLogout}
          className="flex w-full items-center px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
