import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getQuartiers, Quartier } from '../services/quartier.service'

const Signup = () => {
    const [nom, setNom] = useState('')
    const [prenom, setPrenom] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [telephone, setTelephone] = useState('')
    const [adresse, setAdresse] = useState('')
    const [dateNaissance, setDateNaissance] = useState('')
    const [quartierId, setQuartierId] = useState('')
    // Quartiers de test (au cas où l'API ne fonctionne pas)
    const quartiersTest = [
        { id: 1, nom_quartier: 'Centre', ville: 'Paris', code_postal: '75001' },
        { id: 2, nom_quartier: 'Montmartre', ville: 'Paris', code_postal: '75018' },
        { id: 3, nom_quartier: 'Le Marais', ville: 'Paris', code_postal: '75004' },
        { id: 4, nom_quartier: 'Saint-Germain-des-Prés', ville: 'Paris', code_postal: '75006' },
        { id: 5, nom_quartier: 'Belleville', ville: 'Paris', code_postal: '75020' }
    ];

    const [quartiers, setQuartiers] = useState<Quartier[]>(quartiersTest)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingQuartiers, setIsLoadingQuartiers] = useState(false)

    const { register } = useAuth()
    const navigate = useNavigate()

    // Charger les quartiers au chargement du composant
    useEffect(() => {
        const fetchQuartiers = async () => {
            try {
                console.log('Début de la récupération des quartiers...');
                const data = await getQuartiers();
                console.log('Quartiers récupérés dans Signup:', data);
                setQuartiers(data);
            } catch (error) {
                console.error('Erreur lors du chargement des quartiers:', error);
                setError('Impossible de charger les quartiers. Veuillez réessayer.');
            } finally {
                setIsLoadingQuartiers(false);
            }
        };

        fetchQuartiers();
    }, [])

    const validateForm = () => {
        // Vérifier que les mots de passe correspondent
        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas')
            return false
        }

        // Vérifier la complexité du mot de passe
        if (password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères')
            return false
        }

        // Vérifier les critères du mot de passe
        const hasUpperCase = /[A-Z]/.test(password)
        const hasLowerCase = /[a-z]/.test(password)
        const hasNumbers = /[0-9]/.test(password)
        const hasSpecialChar = /[\W_]/.test(password)

        if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
            setError('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial')
            return false
        }

        // Vérifier le téléphone
        if (telephone && !/^[0-9]{10}$/.test(telephone)) {
            setError('Le numéro de téléphone doit contenir 10 chiffres')
            return false
        }

        // Vérifier l'adresse
        if (!adresse.trim()) {
            setError('L\'adresse est requise pour une application de quartier')
            return false
        }

        // Vérifier le quartier
        if (!quartierId) {
            setError('Veuillez sélectionner un quartier')
            return false
        }

        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')


        if (!validateForm()) {
            return
        }

        setIsLoading(true)

        try {
            await register({
                nom,
                prenom,
                email,
                password,
                telephone,
                adresse,
                date_naissance: dateNaissance || undefined,
                quartier_id: quartierId ? parseInt(quartierId) : undefined
            })
            navigate('/')
        } catch (err: any) {
            setError(err.message || 'Erreur lors de l\'inscription')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
                <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">Inscription</h2>

                {error && (
                    <div className="mb-4 rounded-md bg-red-100 p-3 text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4 grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="nom" className="mb-2 block text-sm font-medium text-gray-700">
                                Nom
                            </label>
                            <input
                                id="nom"
                                type="text"
                                placeholder="Votre nom"
                                value={nom}
                                onChange={e => setNom(e.target.value)}
                                className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="prenom" className="mb-2 block text-sm font-medium text-gray-700">
                                Prénom
                            </label>
                            <input
                                id="prenom"
                                type="text"
                                placeholder="Votre prénom"
                                value={prenom}
                                onChange={e => setPrenom(e.target.value)}
                                className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="votre@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                            Mot de passe
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Votre mot de passe"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                            required
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.
                        </p>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
                            Confirmer le mot de passe
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirmez votre mot de passe"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="telephone" className="mb-2 block text-sm font-medium text-gray-700">
                            Téléphone
                        </label>
                        <input
                            id="telephone"
                            type="tel"
                            placeholder="0601020304"
                            value={telephone}
                            onChange={e => setTelephone(e.target.value)}
                            className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="adresse" className="mb-2 block text-sm font-medium text-gray-700">
                            Adresse
                        </label>
                        <input
                            id="adresse"
                            type="text"
                            placeholder="Votre adresse"
                            value={adresse}
                            onChange={e => setAdresse(e.target.value)}
                            className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="quartier" className="mb-2 block text-sm font-medium text-gray-700">
                            Quartier
                        </label>
                        <select
                            id="quartier"
                            value={quartierId}
                            onChange={e => setQuartierId(e.target.value)}
                            className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                            required
                            disabled={isLoadingQuartiers}
                        >
                            <option value="">Sélectionnez un quartier</option>
                            {quartiers && quartiers.length > 0 ? (
                                quartiers.map(quartier => (
                                    <option key={quartier.id} value={quartier.id}>
                                        {quartier.nom_quartier} {quartier.ville && `- ${quartier.ville}`} {quartier.code_postal && `(${quartier.code_postal})`}
                                    </option>
                                ))
                            ) : (
                                <option value="" disabled>Aucun quartier disponible</option>
                            )}
                        </select>
                        {isLoadingQuartiers && <p className="mt-1 text-xs text-gray-500">Chargement des quartiers...</p>}
                    </div>

                    <div className="mb-6">
                        <label htmlFor="dateNaissance" className="mb-2 block text-sm font-medium text-gray-700">
                            Date de naissance
                        </label>
                        <input
                            id="dateNaissance"
                            type="date"
                            value={dateNaissance}
                            onChange={e => setDateNaissance(e.target.value)}
                            className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-md bg-blue-500 p-2 text-white hover:bg-blue-600 focus:outline-none disabled:bg-blue-300"
                    >
                        {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
                    </button>
                </form>

                <div className="mt-4 text-center text-sm text-gray-600">
                    Déjà inscrit ?
                    <Link to="/login" className="ml-1 text-blue-500 hover:text-blue-700">
                        Se connecter
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Signup
