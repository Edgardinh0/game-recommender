import * as z from 'zod'
import { useForm, type SubmitHandler } from 'react-hook-form' 
import { zodResolver } from '@hookform/resolvers/zod'

const RegisterUserSchema = z.object({
        username: z.string()
            .min(1, { error: 'Input your username'}),
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

export default function Form() {
    const { register, handleSubmit, formState } = useForm<RegisterUserSchemaType>({
        resolver: zodResolver(RegisterUserSchema)
    })

    const onSubmit: SubmitHandler<RegisterUserSchemaType> = (data) => {
        console.log(data)
    }
    
    return (
        <form className='gap-2 flex flex-col ' onSubmit={handleSubmit(onSubmit)}>
            <input {...register('username')} type='text' placeholder='username'></input>
            {formState.errors.username && <div className='text-red-600'>{formState.errors.username.message}</div>}
            <input {...register('password')} type='password' placeholder='password'></input>
            {formState.errors.password && <div className='text-red-600'>{formState.errors.password.message}</div>}
            <input {...register('confirmPassword')} type='password' placeholder='confirm password'></input>
            {formState.errors.confirmPassword && <div className='text-red-600'>{formState.errors.confirmPassword.message}</div>}
            <button type='submit' className='cursor-pointer w-fit'>Register</button>
        </form>
    )
}