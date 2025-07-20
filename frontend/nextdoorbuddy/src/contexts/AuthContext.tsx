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
    email_verified?: boolean;
    email_verified_at?: string;
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
    register: (userData: any) => Promise<{ user: User; verification: any }>;
    logout: () => void;
    refreshAccessToken: () => Promise<string | null>;
    updateUserInfo: (userData: Partial<User>) => void;
    verifyEmail: (userId: number, code: string) => Promise<void>;
    resendVerificationEmail: (userId: number) => Promise<void>;
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

            const data = await response.json();

            if (!response.ok) {
                // Handle email verification error specifically
                if (response.status === 403 && !data.emailVerified) {
                    const error = new Error(data.message || 'Email non vérifié');
                    (error as any).emailVerified = false;
                    (error as any).verificationStatus = data.verificationStatus;
                    (error as any).user = data.user;
                    throw error;
                }

                throw new Error(data.message || 'Échec de la connexion');
            }

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

    const register = async (userData: any): Promise<{ user: User; verification: any }> => {
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

            // Don't auto-login anymore, just return the data
            return {
                user: data.user,
                verification: data.verification
            };
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

    const verifyEmail = async (userId: number, code: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/verify-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, code }),
            });

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.message || 'Erreur lors de la vérification');
                (error as any).remainingAttempts = data.remainingAttempts;
                throw error;
            }

            // Auto-login after successful verification
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);

            setUser(data.user);
            setAccessToken(data.accessToken);
            setRefreshToken(data.refreshToken);
        } catch (error) {
            console.error('Erreur de vérification email:', error);
            throw error;
        }
    };

    const resendVerificationEmail = async (userId: number) => {
        try {
            const response = await fetch(`${API_URL}/auth/resend-verification`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erreur lors du renvoi du code');
            }

            return data;
        } catch (error) {
            console.error('Erreur de renvoi de vérification:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                refreshToken,
                isAuthenticated: !!user && user.email_verified === true,
                isLoading,
                login,
                register,
                logout,
                refreshAccessToken,
                updateUserInfo,
                verifyEmail,
                resendVerificationEmail,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
