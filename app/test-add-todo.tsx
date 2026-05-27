import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function TestAddTodo() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Insert a test todo
  const { data, error } = await supabase
    .from('todos')
    .insert({ name: 'Test Todo from Opencode' })
    .select()

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div>
      <h1>Test Todo Added Successfully!</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <p>Now check the main page to see if it appears in the list.</p>
    </div>
  )
}