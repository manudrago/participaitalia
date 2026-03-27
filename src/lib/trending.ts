// Trending score: votes + recency boost + comment activity
export function trendingScore(upvotes: number, downvotes: number, commentCount: number, createdAt: string): number {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
  const gravity = 1.8
  const score = upvotes - downvotes + commentCount * 0.5
  return score / Math.pow(ageHours + 2, gravity)
}

export function isControversial(upvotes: number, downvotes: number): boolean {
  const total = upvotes + downvotes
  if (total < 10) return false
  const ratio = Math.min(upvotes, downvotes) / Math.max(upvotes, downvotes)
  return ratio > 0.4
}
