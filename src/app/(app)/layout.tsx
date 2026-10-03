import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from '@/components/LogoutButton'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white px-4 py-2.5 flex items-center gap-6 shrink-0">
        <Link href="/documents" className="font-semibold text-gray-900 text-sm">
          PracticeWriter
        </Link>
        <nav className="flex gap-4 text-sm text-gray-500">
          <Link href="/documents" className="hover:text-gray-900 transition-colors">
            Documentos
          </Link>
          <Link href="/corrections" className="hover:text-gray-900 transition-colors">
            Correcciones
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden sm:inline">{user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}
