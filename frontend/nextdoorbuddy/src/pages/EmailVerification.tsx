import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import VerificationCodeInput from '../components/VerificationCodeInput';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

interface LocationState {
    email?: string;
    userId?: number;
    fromRegistration?: boolean;
}

const EmailVerification: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isLoading: authLoading, verifyEmail, resendVerificationEmail } = useAuth();

    const state = location.state as LocationState;

    // Debug logging
    console.log('EmailVerification - Location state:', state);
    console.log('EmailVerification - Location:', location);
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [canResend, setCanResend] = useState(true);
    const [nextResendTime, setNextResendTime] = useState<Date | undefined>();
    const [remainingAttempts, setRemainingAttempts] = useState<number | undefined>();
    const [isVerified, setIsVerified] = useState(false);

    // Get email and userId from state or user context
    const email = state?.email || user?.email;
    const userId = state?.userId || user?.id;

    // Redirect if no email/userId available, but only after auth has finished loading
    useEffect(() => {
        // Don't redirect while auth is still loading
        if (authLoading) return;

        // Give a small delay to allow navigation state to settle
        const timer = setTimeout(() => {
            if (!email || !userId) {
                console.error('EmailVerification: Missing required data after auth loaded', {
                    state,
                    user,
                    authLoading,
                    email,
                    userId
                });
                navigate('/login');
            }
        }, 200); // Slightly longer delay to ensure everything is settled

        return () => clearTimeout(timer);
    }, [email, userId, navigate, authLoading]);

    // Fetch verification status on mount
    useEffect(() => {
        if (userId) {
            fetchVerificationStatus();
        }
    }, [userId]);

    const fetchVerificationStatus = async () => {
        if (!userId) return;

        try {
            const response = await fetch(`/api/auth/verification-status/${userId}`);
            const data = await response.json();

            if (data.success) {
                setCanResend(data.status.canResendCode);
                setNextResendTime(data.status.nextResendTime ? new Date(data.status.nextResendTime) : undefined);

                if (data.status.isVerified) {
                    setIsVerified(true);
                    setSuccess('Votre email a déjà été vérifié !');
                    setTimeout(() => navigate('/'), 2000);
                }
            }
        } catch (error) {
            console.error('Erreur lors de la récupération du statut de vérification:', error);
        }
    };

    const handleVerify = async (code: string) => {
        if (!userId) return;

        setIsLoading(true);
        setError('');
        setSuccess('');

        try {
            await verifyEmail(userId, code);
            setIsVerified(true);
            setSuccess('Email vérifié avec succès ! Redirection en cours...');

            // Redirect to home after successful verification
            setTimeout(() => {
                navigate('/', { replace: true });
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la vérification');

            // Extract remaining attempts from error response
            if (err.remainingAttempts !== undefined) {
                setRemainingAttempts(err.remainingAttempts);
            }

            // If no attempts left, refresh status
            if (err.remainingAttempts === 0) {
                setTimeout(fetchVerificationStatus, 1000);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!userId) return;

        setIsResending(true);
        setError('');
        setSuccess('');

        try {
            await resendVerificationEmail(userId);
            setSuccess('Nouveau code envoyé ! Vérifiez votre email.');

            // Update resend status
            setCanResend(false);
            const newNextResendTime = new Date();
            newNextResendTime.setHours(newNextResendTime.getHours() + 1);
            setNextResendTime(newNextResendTime);
        } catch (err: any) {
            setError(err.message || 'Erreur lors du renvoi du code');
        } finally {
            setIsResending(false);
        }
    };

    const handleGoBack = () => {
        if (state?.fromRegistration) {
            navigate('/signup');
        } else {
            navigate('/login');
        }
    };

    // Show loading state while auth is loading or data is not yet available
    if (authLoading || (!email || !userId)) {
        // If auth is still loading, show loading spinner
        if (authLoading) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex items-center justify-center p-4">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Chargement...</p>
                    </div>
                </div>
            );
        }

        // If auth is loaded but no data, show error state
        if (!email || !userId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md text-center"
                >
                    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-4">
                                Données manquantes
                            </h1>
                            <p className="text-gray-600 mb-6">
                                Les informations nécessaires pour la vérification email sont manquantes.
                            </p>
                            <div className="space-y-3">
                                <Button asChild className="w-full">
                                    <Link to="/signup">
                                        Créer un compte
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="w-full">
                                    <Link to="/login">
                                        Se connecter
                                    </Link>
                                </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-4">
                                Debug info: email={state?.email || 'missing'}, userId={state?.userId || 'missing'}
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
        }
    }

    if (isVerified) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-white flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="mx-auto w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-6"
                    >
                        <CheckCircle className="w-12 h-12 text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Email vérifié !
                    </h1>
                    <p className="text-gray-600 text-lg mb-6">
                        Bienvenue sur DoorBudy ! Vous allez être redirigé vers l'accueil.
                    </p>
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                        <span>Redirection en cours...</span>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Back Button */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute top-4 left-4 z-10"
            >
                <Button
                    variant="outline"
                    onClick={handleGoBack}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour</span>
                </Button>
            </motion.div>

            {/* Verification Component */}
            <VerificationCodeInput
                onVerify={handleVerify}
                onResend={handleResend}
                isLoading={isLoading}
                isResending={isResending}
                error={error}
                success={success}
                email={email}
                canResend={canResend}
                nextResendTime={nextResendTime}
                remainingAttempts={remainingAttempts}
            />
        </div>
    );
};

export default EmailVerification;
