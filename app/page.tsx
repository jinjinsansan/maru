import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/getUser'
import InviteForm from '@/components/InviteForm'

export default async function InvitePage() {
  const user = await getServerUser()
  if (user) redirect('/mypage')

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <InviteForm />
    </div>
  )
}
