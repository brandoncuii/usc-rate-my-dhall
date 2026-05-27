import { SupabaseClient } from '@supabase/supabase-js'

interface RatingStats {
  [menuItemId: string]: { avgRating: number; count: number }
}

/**
 * Fetch aggregated rating stats for a list of menu item IDs.
 * Tries the `get_rating_stats` RPC first (single query).
 * Falls back to manual aggregation if the RPC is not deployed yet.
 */
export async function fetchRatingStats(
  supabase: SupabaseClient,
  menuItemIds: string[],
): Promise<RatingStats> {
  if (menuItemIds.length === 0) return {}

  // Try the RPC first
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_rating_stats', {
    item_ids: menuItemIds,
  })

  if (!rpcError && rpcData) {
    const stats: RatingStats = {}
    for (const row of rpcData) {
      stats[row.menu_item_id] = {
        avgRating: Number(row.avg_rating),
        count: Number(row.rating_count),
      }
    }
    return stats
  }

  // Fallback: manual aggregation
  const { data: ratings } = await supabase
    .from('ratings')
    .select('menu_item_id, score')
    .in('menu_item_id', menuItemIds)

  const stats: RatingStats = {}
  ratings?.forEach((rating) => {
    if (!stats[rating.menu_item_id]) {
      stats[rating.menu_item_id] = { avgRating: 0, count: 0 }
    }
    const s = stats[rating.menu_item_id]
    s.avgRating = (s.avgRating * s.count + rating.score) / (s.count + 1)
    s.count += 1
  })

  return stats
}
