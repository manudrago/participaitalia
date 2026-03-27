export interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  badge: 'top_contributor' | null
  created_at: string
}

export interface Proposal {
  id: string
  user_id: string
  title: string
  problem: string
  solution: string
  pros: string[]
  cons: string[]
  status: 'active' | 'flagged' | 'removed'
  vote_score: number
  upvotes: number
  downvotes: number
  comment_count: number
  created_at: string
  updated_at: string
  author?: Profile
  user_vote?: number | null
  is_controversial?: boolean
}

export interface Vote {
  id: string
  user_id: string
  proposal_id: string
  value: 1 | -1
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  proposal_id: string
  parent_id: string | null
  content: string
  vote_score: number
  created_at: string
  author?: Profile
  replies?: Comment[]
  user_vote?: number | null
}

export interface Report {
  id: string
  user_id: string
  target_id: string
  target_type: 'proposal' | 'comment'
  reason: string
  created_at: string
}

export type SortOption = 'trending' | 'recent' | 'top'
