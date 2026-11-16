import * as z from 'zod'
import { useForm, type SubmitHandler } from 'react-hook-form' 
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import api from '../../src/api/client'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { AxiosError } from 'axios'
import { useNavigate } from '@tanstack/react-router'
import cn from '../utils/cn.ts'

const RegisterUserSchema = z.object({
        username: z.string()
            .min(1, { error: 'Input your username'})
            .min(3, { error: 'Username must be at least 3 characters long'})
            .regex(/^[a-zA-Z0-9_]+$/, {error: 'Username must consist of only letters, numbers and _'}),
        password: z.string()
            .min(1, { error: 'Enter your password'})
            .min(6, { error: 'Password must be at least 6 characters'}),
        confirmPassword: z.string()
            .min(1, { error: 'Enter your password'})
            .min(6, { error: 'Password must be at least 6 characters'}),
    }).refine((data) => data.password === data.confirmPassword , {
        error: 'Passwords must match',
        path: ['confirmPassword']
    })

type RegisterUserSchemaType = z.infer<typeof RegisterUserSchema>

export default function RegisterPage() {
    const [serverError, setServerError] = useState(false)
    
    const navigate = useNavigate({from: '/register'})

    const { register, handleSubmit, formState, setError } = useForm<RegisterUserSchemaType>({
        resolver: zodResolver(RegisterUserSchema)
    })

    const mutation = useMutation({
        mutationFn: registerUser,
        onSuccess: () => {
            navigate({
                to: '/login'
            })
        },
        onError: (error: AxiosError<{error?: string}>) => {
            if (error.response) {
                console.log(error.response.data.error)
                const serverMessage = error.response.data.error || 'Registration Error'
                setError('username', {type: 'custom', message: serverMessage})
            } else if (error.request) {
                setServerError(true)
            } else {
                console.error('Request Error')
                setServerError(true)
            }
        }
    })
        
    async function registerUser(data: {username: string, password: string}) {
        await api.post('/api/auth/register', data)
    }

    const onSubmit: SubmitHandler<RegisterUserSchemaType> = (data) => {
        setServerError(false)
        mutation.mutate(data)
    }
        
    return (
        <div className='flex flex-col items-center justify-center min-h-screen'>
            <form className='gap-2 flex flex-col w-1/2 md:w-1/3 mb-3 border p-4' onSubmit={handleSubmit(onSubmit)}>
                <div className='flex flex-col gap-1'>
                    <input {...register('username')} type='text' placeholder='username' className='placeholder-zinc-400 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-violet-600'></input>
                    <div className={cn('text-red-600 min-h-6', {'opacity-0': !formState.errors.username})}>{formState.errors.username?.message}</div>
                </div>
                <div className='flex flex-col gap-1'>
                    <input {...register('password')} type='password' placeholder='password' className='placeholder-zinc-400 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-violet-600'></input>
                    <div className={cn('text-red-600 min-h-6', {'opacity-0': !formState.errors.password})}>{formState.errors.password?.message}</div>
                </div>
                <div className='flex flex-col gap-1'>
                    <input {...register('confirmPassword')} type='password' placeholder='confirm password' className='placeholder-zinc-400 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-violet-600'></input>
                    <div className={cn('text-red-600 min-h-6', {'opacity-0': !formState.errors.confirmPassword})}>{formState.errors.confirmPassword?.message}</div>
                </div>
                <div className='flex flex-col gap-1'>
                    <button type='submit' className='cursor-pointer w-fit self-center text-zinc-100 border rounded-md p-2 hover:outline-none hover:ring-2 hover:ring-violet-600'>Register</button>
                    <div className={cn('text-red-600 min-h-6', {'opacity-0': !serverError})}>Internal server error</div>
                </div>
            </form>
            <div className='flex flex-col items-center gap-3'>
                <span>Already registered? Log in</span>
                <Link to='/login'>
                    <button className='cursor-pointer w-fit self-center text-zinc-100 border rounded-md p-2 hover:outline-none hover:ring-2 hover:ring-violet-600'>Log in</button>
                </Link>
            </div>
        </div>
        
    )
}