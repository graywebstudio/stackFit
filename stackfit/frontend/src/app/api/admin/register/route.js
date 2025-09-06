import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    // Get the authorization token
    const token = request.headers.get('authorization')?.split(' ')[1]
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    // Get the request body
    const body = await request.json()
    const { name, email, password } = body

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('admins')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Insert new admin into Supabase
    const { data: newAdmin, error: insertError } = await supabase
      .from('admins')
      .insert([
        {
          name,
          email,
          password: hashedPassword,
          role: 'admin'
        }
      ])
      .select()
      .single()

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      throw new Error('Failed to create admin account')
    }

    // Return success response without password
    return NextResponse.json(
      {
        message: 'Admin registered successfully',
        user: {
          id: newAdmin.id,
          name: newAdmin.name,
          email: newAdmin.email,
          role: newAdmin.role
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 