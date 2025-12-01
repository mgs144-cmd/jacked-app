'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Loader2, Search, User, Mail, Calendar } from 'lucide-react'

interface PendingUser {
  id: string
  email: string
  username: string | null
  full_name: string | null
  created_at: string
  has_paid_onboarding: boolean
}

export function AdminDashboard() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [allUsers, setAllUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const supabase = createClient()

  const loadUsers = async () => {
    setLoading(true)
    try {
      // Get all users who haven't paid
      const { data: unpaidUsers, error: unpaidError } = await (supabase
        .from('profiles') as any)
        .select('id, username, full_name, has_paid_onboarding, created_at, email')
        .eq('has_paid_onboarding', false)
        .order('created_at', { ascending: false })

      if (unpaidError) throw unpaidError

      // Get all users who have paid
      const { data: paidUsers, error: paidError } = await (supabase
        .from('profiles') as any)
        .select('id, username, full_name, has_paid_onboarding, created_at, email, onboarding_payment_id')
        .eq('has_paid_onboarding', true)
        .order('created_at', { ascending: false })

      if (paidError) throw paidError

      setUnpaidUsers(unpaidUsers || [])
      setPaidUsers(paidUsers || [])
    } catch (err: any) {
      console.error('Error loading users:', err)
      alert('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    setLoading(true)
    try {
      // Get all users who haven't paid
      const { data: unpaidUsers, error: unpaidError } = await (supabase
        .from('profiles') as any)
        .select('id, username, full_name, has_paid_onboarding, created_at, email')
        .eq('has_paid_onboarding', false)
        .order('created_at', { ascending: false })

      if (unpaidError) throw unpaidError

      // Email is now stored in profiles table (added during signup)
      const usersWithEmails = unpaidUsers?.map((user: any) => ({
        ...user,
        email: user.email || 'Email not available',
      })) || []

      setPendingUsers(usersWithEmails)
      setAllUsers(usersWithEmails)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const approveUser = async (userId: string) => {
    setProcessing(userId)
    try {
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ has_paid_onboarding: true })
        .eq('id', userId)

      if (error) throw error

      // Reload users
      await loadUsers()
    } catch (error) {
      console.error('Error approving user:', error)
      alert('Failed to approve user. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  const filteredUsers = searchTerm
    ? pendingUsers.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : pendingUsers

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-800/60 p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-black text-white">Admin Dashboard</h1>
          <button
            onClick={loadUsers}
            className="btn-secondary px-4 py-2 text-sm font-bold"
          >
            Refresh
          </button>
        </div>

        <p className="text-gray-400 mb-6">
          View pending accounts. Payments are automatically processed via Stripe webhooks.
          Manual approval is only needed if webhook fails.
        </p>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email, username, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-full pl-10"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">No pending approvals</p>
              <p className="text-sm mt-2">All users have been approved!</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-gray-800/40 rounded-xl border border-gray-700 p-6 rounded-xl"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <h3 className="text-white font-bold text-lg">
                          {user.full_name || user.username || 'No name'}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(user.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {user.username && (
                          <p className="text-gray-500 text-sm mt-1">@{user.username}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => approveUser(user.id)}
                    disabled={processing === user.id}
                    className="btn-primary px-6 py-2 flex items-center space-x-2 disabled:opacity-50"
                  >
                    {processing === user.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800">
          <p className="text-gray-400 text-sm">
            <strong className="text-white">Total Pending:</strong> {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>
  )
}

