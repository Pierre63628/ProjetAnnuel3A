import { useState } from 'react'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Connexion avec', { email, password })
        // Appel API à venir ici
    }

    return (
        <div>
            <h2>Connexion</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
                <br />
                <input
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
                <br />
                <button type="submit">Se connecter</button>
            </form>
        </div>
    )
}

export default Login
