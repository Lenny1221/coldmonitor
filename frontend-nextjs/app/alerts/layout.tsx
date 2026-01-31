import { Sidebar } from '@/components/layout/sidebar'

export default function AlertsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:ml-64">
        {children}
      </div>
    </div>
  )
}
