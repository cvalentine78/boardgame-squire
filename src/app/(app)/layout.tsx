import NavBar from '@/components/NavBar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-slate-900 border-b border-slate-700 flex justify-center">
        <NavBar />
      </div>
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-10">
        {children}
      </main>
    </div>
  )
}
