import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/getUser'
import AdminClient from '@/components/AdminClient'

export default async function AdminPage() {
  const user = await getServerUser()
  if (!user) redirect('/')

  return <AdminClient />
}
