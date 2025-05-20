import React, { createContext, useState, useEffect, useContext } from 'react';

interface User {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    adresse?: string;
    adresse_complete?: string;
    latitude?: number;
    longitude?: number;
    date_naissance?: string;
    telephone?: string;
    quartier_id?: number;
    role?: string;
    created_at?: string;
    updated_at?: string;
}

interface AuthContextType {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (userData: any) => Promise<void>;
    logout: () => void;
    refreshAccessToken: () => Promise<string | null>;
    updateUserInfo: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = '/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedAccessToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');

        if (storedUser && storedAccessToken && storedRefreshToken) {
            setUser(JSON.parse(storedUser));
            setAccessToken(storedAccessToken);
            setRefreshToken(storedRefreshToken);
        }

        setIsLoading(false);
    }, []);

    // Effet pour rafraîchir automatiquement le token d'accès
    useEffect(() => {
        if (!accessToken || !refreshToken) return;

        const tokenCheckInterval = setInterval(async () => {
            try {
                const tokenParts = accessToken.split('.');
                if (tokenParts.length !== 3) return;

                const payload = JSON.parse(atob(tokenParts[1]));
                const expirationTime = payload.exp * 1000; // Convertir en millisecondes
                const currentTime = Date.now();
                const timeUntilExpiry = expirationTime - currentTime;

                if (timeUntilExpiry < 120000) {
                    await refreshAccessToken();
                }
            } catch (error) {
                await refreshAccessToken();
            }
        }, 60000); // 60 sec

        return () => clearInterval(tokenCheckInterval);
    }, [accessToken, refreshToken]);

    const login = async (email: string, password: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Échec de la connexion');
            }

            const data = await response.json();

            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);

            setUser(data.user);
            setAccessToken(data.accessToken);
            setRefreshToken(data.refreshToken);
        } catch (error) {
            console.error('Erreur de connexion:', error);
            throw error;
        }
    };

    const register = async (userData: any) => {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Échec de l\'inscription');
            }

            const data = await response.json();

            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);

            setUser(data.user);
            setAccessToken(data.accessToken);
            setRefreshToken(data.refreshToken);
        } catch (error) {
            console.error('Erreur d\'inscription:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            if (refreshToken) {
                await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken }),
                });
            }
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        } finally {
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');

            setUser(null);
            setAccessToken(null);
            setRefreshToken(null);
        }
    };

    const refreshAccessToken = async (): Promise<string | null> => {
        if (!refreshToken) return null;

        try {
            const response = await fetch(`${API_URL}/auth/refresh-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) {
                throw new Error('Échec du rafraîchissement du token');
            }

            const data = await response.json();

            localStorage.setItem('accessToken', data.accessToken);
            setAccessToken(data.accessToken);

            return data.accessToken;
        } catch (error) {
            console.error('Erreur lors du rafraîchissement du token:', error);
            logout();
            return null;
        }
    };

    const updateUserInfo = (userData: Partial<User>) => {
        if (!user) return;

        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                refreshToken,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
                refreshAccessToken,
                updateUserInfo,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
    }
    return context;
};

export default AuthContext;
