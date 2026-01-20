import { supabase } from '@/lib/supabase'
import { DiningHall } from '@/lib/types'

export default async function Home() {
  // Example: fetch all dining halls from Supabase
  const { data: halls, error } = await supabase
    .from('dining_halls')
    .select('*')

  if (error) {
    return <div>Error loading dining halls: {error.message}</div>
  }

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">USC Dining Ratings</h1>
      
      <div className="space-y-2">
        {halls?.map((hall: DiningHall) => (
          <div key={hall.id} className="p-4 border rounded">
            <h2 className="font-semibold">{hall.name}</h2>
            <p className="text-gray-500 text-sm">/{hall.slug}</p>
          </div>
        ))}
      </div>

      {/* 
        TODO: Build out from here
        - Add menu items display
        - Add rating functionality  
        - Add authentication
        - Style it up
      */}
    </main>
  )
}
