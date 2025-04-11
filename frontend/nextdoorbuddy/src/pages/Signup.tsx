import { useState } from 'react'

const Signup = () => {
    const [nom, setNom] = useState('')
    const [prenom, setPrenom] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('') // TODO: ajouter côté back
    const [telephone, setTelephone] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Inscription avec', { nom, prenom, email, password, telephone })
        //TODO: Appel API
    }

    return (
        <div>
            <h2>Inscription</h2>
            <form onSubmit={handleSubmit}>
                <input placeholder="Nom" value={nom} onChange={e => setNom(e.target.value)} required />
                <br />
                <input placeholder="Prénom" value={prenom} onChange={e => setPrenom(e.target.value)} required />
                <br />
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                <br />
                <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required />
                <br />
                <input placeholder="Téléphone" value={telephone} onChange={e => setTelephone(e.target.value)} />
                <br />
                <button type="submit">S'inscrire</button>
            </form>
        </div>
    )
}

export default Signup
