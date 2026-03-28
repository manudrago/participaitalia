import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

const SUPER_ADMIN_EMAIL = 'emauel.draghetti@gmail.com'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { data: callerProfile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!callerProfile || !['admin', 'super_admin'].includes(callerProfile.role))
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })

  const admin = createAdminClient()

  // Check target user
  const { data: targetAuth } = await admin.auth.admin.getUserById(id)
  if (targetAuth?.user?.email === SUPER_ADMIN_EMAIL)
    return NextResponse.json({ error: 'Non puoi modificare il super amministratore' }, { status: 403 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}

  if (typeof body.is_blocked === 'boolean') updates.is_blocked = body.is_blocked
  if (body.role) {
    if (body.role === 'super_admin' && callerProfile.role !== 'super_admin')
      return NextResponse.json({ error: 'Solo un super amministratore può promuovere altri super amministratori' }, { status: 403 })
    updates.role = body.role
  }

  const { error } = await admin.from('profiles').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

  const { data: callerProfile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (!callerProfile || !['admin', 'super_admin'].includes(callerProfile.role))
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })

  const admin = createAdminClient()

  const { data: targetAuth } = await admin.auth.admin.getUserById(id)
  if (targetAuth?.user?.email === SUPER_ADMIN_EMAIL)
    return NextResponse.json({ error: 'Non puoi eliminare il super amministratore' }, { status: 403 })

  const { data: targetProfile } = await admin.from('profiles').select('role').eq('id', id).single()
  if (targetProfile?.role === 'super_admin' && callerProfile.role !== 'super_admin')
    return NextResponse.json({ error: 'Non puoi eliminare un super amministratore' }, { status: 403 })

  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
