import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

interface LocationState {
    email?: string;
    userId?: number;
}

const VerificationSent: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState;

    // Debug logging
    console.log('VerificationSent - Location state:', state);

    const handleContinueToVerification = () => {
        navigate('/verify-email', {
            state: {
                email: state?.email,
                userId: state?.userId,
                fromRegistration: true
            }
        });
    };

    const handleBackToLogin = () => {
        navigate('/login');
    };

    const maskedEmail = state?.email?.replace(/(.{2})(.*)(@.*)/, '$1***$3') || '';

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                    <CardHeader className="text-center pb-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6"
                        >
                            <Mail className="w-10 h-10 text-white" />
                        </motion.div>
                        <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                            Vérifiez votre email
                        </CardTitle>
                        <p className="text-gray-600">
                            Nous avons envoyé un email de vérification à
                        </p>
                        <p className="font-medium text-blue-600 text-lg">
                            {maskedEmail}
                        </p>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                        >
                            <h3 className="font-medium text-blue-900 mb-2">
                                Étapes suivantes :
                            </h3>
                            <ol className="text-sm text-blue-800 space-y-1">
                                <li>1. Ouvrez votre boîte email</li>
                                <li>2. Recherchez l'email de DoorBudy</li>
                                <li>3. Cliquez sur le lien ou copiez le code</li>
                                <li>4. Revenez ici pour saisir le code</li>
                            </ol>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Button
                                onClick={handleContinueToVerification}
                                className="w-full h-12 text-lg font-medium"
                            >
                                <span>Saisir le code de vérification</span>
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-center space-y-4"
                        >
                            <div className="text-sm text-gray-600 space-y-2">
                                <p>Vous ne trouvez pas l'email ?</p>
                                <ul className="text-xs space-y-1">
                                    <li>• Vérifiez votre dossier spam/courrier indésirable</li>
                                    <li>• L'email peut prendre quelques minutes à arriver</li>
                                    <li>• Assurez-vous que l'adresse email est correcte</li>
                                </ul>
                            </div>

                            <Button
                                variant="outline"
                                onClick={handleBackToLogin}
                                className="w-full"
                            >
                                Retour à la connexion
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-center text-xs text-gray-500 border-t pt-4"
                        >
                            <p>Le code de vérification expire dans 15 minutes</p>
                            <p className="mt-1">
                                Besoin d'aide ? Contactez notre support
                            </p>
                        </motion.div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default VerificationSent;
