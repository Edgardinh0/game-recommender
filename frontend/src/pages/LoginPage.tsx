import * as z from 'zod'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import api from '../api/client'
import { AxiosError } from 'axios'
import { Link } from '@tanstack/react-router'

const LoginUserSchema = z.object({
    username: z.string()
        .min(1, {error: 'Input your username'})
        .regex(/^[a-zA-Z0-9_]+$/, {error: 'Username must consist of only letters, numbers and _'}),
    password: z.string()
        .min(1, {error: 'Input your password'})
})

type LoginUserSchemaType = z.infer<typeof LoginUserSchema>

export default function LoginPage() {
    const { register, handleSubmit, formState: {errors}, setError } = useForm<LoginUserSchemaType>({
        resolver: zodResolver(LoginUserSchema)
    })

    const [serverError, setServerError] = useState(false)

    async function loginUser(data: {username: string, password: string}) {
        const response = await api.post('/api/auth/login', data)
        console.log(response) 
    }

    const mutation = useMutation({
        mutationFn: loginUser,
        onError: (error: AxiosError<{ message?: string }>) => {
            if (error.response) {
                const serverMessage = error.response.data.message || 'Authorization Error'
                setError('username', {type: 'custom', message: serverMessage})
            } else if (error.request) {
                setServerError(true)
            } else {
                console.error('Request Error')
                setServerError(true)
            }
        }
    })

    const onSubmit: SubmitHandler<LoginUserSchemaType> = (data) => {
        setServerError(false)
        mutation.mutate(data)
    }

    return (
        <div className='flex flex-col items-center justify-center min-h-screen'>
            <form className='gap-2 flex flex-col ' onSubmit={handleSubmit(onSubmit)}>
                <input {...register('username')} type='text' placeholder='username'></input>
                {errors.username && <div className='text-red-600'>{errors.username.message}</div>}
                <input {...register('password')} type='password' placeholder='password'></input>
                {errors.password && <div className='text-red-600'>{errors.password.message}</div>}
                <button type='submit' className='cursor-pointer w-fit'>Login</button>
                {serverError && <div className='text-red-600'>Internal server error</div>}
            </form>
            <div className='flex flex-col'>
                <span>Not registered yet?</span>
                <Link to='/register'>
                    <button className='cursor-pointer'>Register</button>
                </Link>
            </div>
        </div>
       
    )
}