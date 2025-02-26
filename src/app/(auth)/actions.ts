'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '../../../utils/supabase/server'


export async function login(formData: FormData) {
  const supabase = await createClient()

 
  const data = {
    email: formData.email as string,
    password: formData.password as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  redirect('/chat')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()


  const data = {
    email: formData.email as string,
    password: formData.password as string,
    options: {
      data: {
        full_name: formData.fullName as string
      }
    }
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    console.log('error');
  }

  revalidatePath('/', 'layout')
  redirect('/')
}