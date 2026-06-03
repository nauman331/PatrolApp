import { createFileRoute } from '@tanstack/react-router'
import NFCForm from '../components/app-shell/nfc/NFCManagement' // Adjust path based on your folder structure
import { AppLayout } from "@/components/app-shell/layout"; // Adjust path based on your folder structure
import { useAuthProtection } from '@/hooks/useAuthProtection'

export const Route = createFileRoute('/nfc-scans')({
     
  component: RouteComponent,
})

function RouteComponent() {
  useAuthProtection();
  return (
    <AppLayout>
    <div className="flex-1 bg-[#F8F9FA] min-h-screen">
      {/* Page Header - Matching the Shwanix Dashboard style */}
      {/* <header className="bg-white border-b border-gray-100 px-8 py-6 mb-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">NFC Management</h1>
          <p className="text-gray-500 mt-1">Register and configure new hardware checkpoints.</p>
        </div>
      </header> */}

      <main className="max-w-7xl mx-auto">
        <div className="flex justify-center">
          <NFCForm />
        </div>
      </main>
    </div>
    </AppLayout>
  )
}