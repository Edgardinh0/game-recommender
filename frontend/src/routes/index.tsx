import { createFileRoute } from '@tanstack/react-router'
import { useAuthStore } from '../stores/AuthStore'
import { useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const navigate = useNavigate({from: '/'})

  const removeToken = useAuthStore(token => token.removeToken)

  const logout = () => {
    removeToken()
    navigate({
      to: '/login'
    })
  }
  
  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
      <button className='cursor-pointer' onClick={logout}>Logout</button>
    </div>
  )
}