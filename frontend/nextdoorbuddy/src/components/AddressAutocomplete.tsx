import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
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
            <input
                type="text"
                value={query}
                onChange={handleInputChange}
                onFocus={() => query.length >= 3 && setShowSuggestions(true)}
                placeholder="Saisissez votre adresse"
                className="w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
                required={required}
            />

            {isLoading && (
                <div className="absolute right-2 top-2">
                    <svg className="h-5 w-5 animate-spin text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            )}

            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

            {showSuggestions && suggestions.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5"
                >
                    {suggestions.map((suggestion) => (
                        <div
                            key={suggestion.properties.id}
                            className="cursor-pointer px-4 py-2 hover:bg-gray-100"
                            onClick={() => handleSuggestionClick(suggestion)}
                        >
                            <div className="font-medium">{suggestion.properties.label}</div>
                            <div className="text-xs text-gray-500">{suggestion.properties.context}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Affichage des informations sur le quartier */}
            {showQuartierInfo && (
                <div className="mt-2">
                    {isLoadingQuartier && (
                        <div className="flex items-center text-xs text-gray-500">
                            <svg className="mr-1 h-3 w-3 animate-spin text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Recherche du quartier...
                        </div>
                    )}

                    {quartierFound === true && quartierInfo && (
                        <div className="text-xs text-green-600">
                            ✓ Quartier trouvé : <span className="font-medium">{quartierInfo.nom}</span>
                        </div>
                    )}

                    {quartierFound === false && !quartierError && (
                        <div className="text-xs text-amber-600">
                            ⚠️ Aucun quartier trouvé pour cette adresse
                        </div>
                    )}

                    {quartierError && (
                        <div className="text-xs text-red-500">
                            {quartierError}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default AddressAutocomplete
