import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/getUser'
import MyPageClient from '@/components/MyPageClient'

export default async function MyPage() {
  const user = await getServerUser()
  if (!user) redirect('/')

  return <MyPageClient />
}
