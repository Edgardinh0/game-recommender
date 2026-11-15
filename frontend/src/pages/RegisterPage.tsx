import * as z from 'zod'
import { useForm, type SubmitHandler } from 'react-hook-form' 
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import api from '../../src/api/client'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { AxiosError } from 'axios'
import { useNavigate } from '@tanstack/react-router'

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
            <form className='gap-2 flex flex-col ' onSubmit={handleSubmit(onSubmit)}>
                <input {...register('username')} type='text' placeholder='username'></input>
                {formState.errors.username && <div className='text-red-600'>{formState.errors.username.message}</div>}
                <input {...register('password')} type='password' placeholder='password'></input>
                {formState.errors.password && <div className='text-red-600'>{formState.errors.password.message}</div>}
                <input {...register('confirmPassword')} type='password' placeholder='confirm password'></input>
                {formState.errors.confirmPassword && <div className='text-red-600'>{formState.errors.confirmPassword.message}</div>}
                <button type='submit' className='cursor-pointer'>Register</button>
                {serverError && <div className='text-red-600'>Internal server error</div>}
            </form>
            <div className='flex flex-col'>
                <span>Already registered? Log in</span>
                <Link to='/login'>
                    <button className='cursor-pointer'>Log in</button>
                </Link>
            </div>
        </div>
        
    )
}