import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { data: callerProfile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!callerProfile || !['admin', 'super_admin'].includes(callerProfile.role))
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })

  const admin = createAdminClient()
  const { data: authUsers } = await admin.auth.admin.listUsers()
  const { data: profiles } = await admin.from('profiles').select('*').order('created_at', { ascending: false })

  const users = profiles?.map(p => ({
    ...p,
    email: authUsers?.users?.find(u => u.id === p.id)?.email ?? null
  })) ?? []

  return NextResponse.json(users)
}
