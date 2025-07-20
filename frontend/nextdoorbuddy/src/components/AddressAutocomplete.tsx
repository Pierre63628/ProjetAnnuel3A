import { useState, useEffect, useRef } from 'react'
import { findQuartierByCoordinates } from '../services/quartier.service'

interface AddressFeature {
    properties: {
        label: string
        postcode: string
        city: string
        context: string
        id: string
        type: string
        name: string
        housenumber?: string
        street?: string
        x: number
        y: number
    }
    geometry: {
        coordinates: [number, number] // [longitude, latitude]
    }
}

interface AddressAutocompleteProps {
    onAddressSelect: (address: {
        adresse: string
        latitude: number
        longitude: number
        postcode: string
        city: string
        quartier_id?: number
        quartier_nom?: string
        quartierFound?: boolean
    }) => void
    initialValue?: string
    required?: boolean
    showQuartierInfo?: boolean
}

const AddressAutocomplete = ({ onAddressSelect, initialValue = '', required = false, showQuartierInfo = true }: AddressAutocompleteProps) => {
    const [query, setQuery] = useState(initialValue)
    const [suggestions, setSuggestions] = useState<AddressFeature[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingQuartier, setIsLoadingQuartier] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [error, setError] = useState('')
    const [quartierError, setQuartierError] = useState('')
    const [quartierInfo, setQuartierInfo] = useState<{id: number, nom: string} | null>(null)
    const [quartierFound, setQuartierFound] = useState<boolean | null>(null)
    const timeoutRef = useRef<number | null>(null)
    const suggestionsRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Cleanup timeout on component unmount
        return () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    useEffect(() => {
        // Add click outside listener to close suggestions
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const fetchAddressSuggestions = async (searchQuery: string) => {
        if (!searchQuery || searchQuery.length < 3) {
            setSuggestions([])
            return
        }

        setIsLoading(true)
        setError('')

        try {
            const response = await fetch(
                `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(searchQuery)}&limit=5`
            )

            if (!response.ok) {
                throw new Error('Erreur lors de la recherche d\'adresse')
            }

            const data = await response.json()
            setSuggestions(data.features || [])
        } catch (err) {
            console.error('Erreur API adresse:', err)
            setError('Impossible de charger les suggestions d\'adresse')
            setSuggestions([])
        } finally {
            setIsLoading(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setQuery(value)

        // Debounce API calls
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = window.setTimeout(() => {
            fetchAddressSuggestions(value)
        }, 300)

        setShowSuggestions(true)
    }

    const handleSuggestionClick = async (suggestion: AddressFeature) => {
        const { properties, geometry } = suggestion
        const [longitude, latitude] = geometry.coordinates

        // Format the address for display - utiliser le label complet de l'API
        const formattedAddress = properties.label

        setQuery(formattedAddress)
        setSuggestions([])
        setShowSuggestions(false)

        // Réinitialiser les informations sur le quartier
        setQuartierInfo(null)
        setQuartierFound(null)
        setQuartierError('')

        // Préparer l'objet d'adresse à retourner
        const addressData = {
            adresse: formattedAddress,
            latitude,
            longitude,
            postcode: properties.postcode,
            city: properties.city
        }

        // Si l'option showQuartierInfo est activée, rechercher le quartier correspondant
        if (showQuartierInfo) {
            setIsLoadingQuartier(true)

            try {
                // Vérifier que les coordonnées sont valides avant d'appeler l'API
                if (isNaN(longitude) || isNaN(latitude)) {
                    console.error('Coordonnées invalides:', { longitude, latitude })
                    setQuartierError('Coordonnées invalides pour la recherche de quartier')
                    setQuartierFound(false)
                    Object.assign(addressData, { quartierFound: false })
                } else {
                    console.log('Recherche de quartier pour les coordonnées:', { longitude, latitude })
                    const result = await findQuartierByCoordinates(longitude, latitude)

                    if (result.quartierFound && result.quartier) {
                        console.log('Quartier trouvé:', result.quartier)
                        setQuartierInfo({
                            id: result.quartier.id,
                            nom: result.quartier.nom_quartier
                        })
                        setQuartierFound(true)

                        // Ajouter les informations sur le quartier à l'objet d'adresse
                        Object.assign(addressData, {
                            quartier_id: result.quartier.id,
                            quartier_nom: result.quartier.nom_quartier,
                            quartierFound: true
                        })
                    } else {
                        console.log('Aucun quartier trouvé pour ces coordonnées')
                        setQuartierFound(false)
                        Object.assign(addressData, { quartierFound: false })
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la recherche du quartier:', error)
                setQuartierError('Impossible de déterminer le quartier pour cette adresse')
                setQuartierFound(false)
                Object.assign(addressData, { quartierFound: false })
            } finally {
                setIsLoadingQuartier(false)
            }
        }

        // Pass the selected address back to the parent component
        onAddressSelect(addressData)
    }

    return (
        <div className="relative">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => query.length >= 3 && setShowSuggestions(true)}
                    placeholder="Saisissez votre adresse"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    required={required}
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </div>

            {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="h-5 w-5 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            )}

            {error && <p className="mt-2 text-xs text-red-500 flex items-center space-x-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
            </p>}

            {showSuggestions && suggestions.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className="absolute z-10 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white py-2 shadow-xl border border-gray-200 backdrop-blur-sm"
                >
                    {suggestions.map((suggestion) => (
                        <div
                            key={suggestion.properties.id}
                            className="cursor-pointer px-4 py-3 hover:bg-blue-50 transition-colors duration-150 border-b border-gray-100 last:border-b-0"
                            onClick={() => handleSuggestionClick(suggestion)}
                        >
                            <div className="font-medium text-gray-900">{suggestion.properties.label}</div>
                            <div className="text-xs text-gray-500 mt-1">{suggestion.properties.context}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Affichage des informations sur le quartier */}
            {showQuartierInfo && (
                <div className="mt-3 space-y-2">
                    {isLoadingQuartier && (
                        <div className="text-xs text-blue-600 flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                            <svg className="animate-spin h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Recherche du quartier...</span>
                        </div>
                    )}

                    {quartierFound === true && quartierInfo && (
                        <div className="text-xs text-green-700 flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Quartier trouvé : <span className="font-medium">{quartierInfo.nom}</span></span>
                        </div>
                    )}

                    {quartierFound === false && !quartierError && (
                        <div className="text-xs text-amber-700 flex items-center space-x-2 bg-amber-50 px-3 py-2 rounded-lg">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>Aucun quartier trouvé pour cette adresse</span>
                        </div>
                    )}

                    {quartierError && (
                        <div className="text-xs text-red-700 flex items-center space-x-2 bg-red-50 px-3 py-2 rounded-lg">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>{quartierError}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default AddressAutocomplete
