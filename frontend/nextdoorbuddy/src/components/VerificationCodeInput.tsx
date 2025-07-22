import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface VerificationCodeInputProps {
    onVerify: (code: string) => Promise<void>;
    onResend: () => Promise<void>;
    isLoading: boolean;
    isResending: boolean;
    error: string;
    success: string;
    email: string;
    canResend: boolean;
    nextResendTime?: Date;
    remainingAttempts?: number;
}

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
    onVerify,
    onResend,
    isLoading,
    isResending,
    error,
    success,
    email,
    canResend,
    nextResendTime,
    remainingAttempts
}) => {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Calculate time left for resend
    useEffect(() => {
        if (nextResendTime) {
            const updateTimeLeft = () => {
                const now = new Date().getTime();
                const resendTime = new Date(nextResendTime).getTime();
                const difference = resendTime - now;
                
                if (difference > 0) {
                    setTimeLeft(Math.ceil(difference / 1000));
                } else {
                    setTimeLeft(0);
                }
            };

            updateTimeLeft();
            const interval = setInterval(updateTimeLeft, 1000);

            return () => clearInterval(interval);
        }
    }, [nextResendTime]);

    const handleInputChange = (index: number, value: string) => {
        if (value.length > 1) return;
        if (value && !/^\d$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all fields are filled
        if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
            onVerify(newCode.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        
        if (pastedData.length === 6) {
            const newCode = pastedData.split('');
            setCode(newCode);
            onVerify(pastedData);
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const isCodeComplete = code.every(digit => digit !== '');
    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

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
                            className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4"
                        >
                            <Mail className="w-8 h-8 text-white" />
                        </motion.div>
                        <CardTitle className="text-2xl font-bold text-gray-900">
                            Vérifiez votre email
                        </CardTitle>
                        <p className="text-gray-600 mt-2">
                            Nous avons envoyé un code de vérification à<br />
                            <span className="font-medium text-blue-600">{maskedEmail}</span>
                        </p>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Code Input */}
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700 text-center">
                                Entrez le code à 6 chiffres
                            </label>
                            <div className="flex justify-center space-x-2">
                                {code.map((digit, index) => (
                                    <motion.input
                                        key={index}
                                        ref={(el) => { inputRefs.current[index] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleInputChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={handlePaste}
                                        className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                                            digit ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                                        } ${error ? 'border-red-500' : ''}`}
                                        disabled={isLoading}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Status Messages */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg"
                            >
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium">{error}</p>
                                    {remainingAttempts !== undefined && remainingAttempts > 0 && (
                                        <p className="text-xs mt-1">
                                            {remainingAttempts} tentative(s) restante(s)
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg"
                            >
                                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm font-medium">{success}</p>
                            </motion.div>
                        )}

                        {/* Verify Button */}
                        <Button
                            onClick={() => onVerify(code.join(''))}
                            disabled={!isCodeComplete || isLoading}
                            className="w-full h-12 text-lg font-medium"
                        >
                            {isLoading ? (
                                <div className="flex items-center space-x-2">
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    <span>Vérification...</span>
                                </div>
                            ) : (
                                'Vérifier le code'
                            )}
                        </Button>

                        {/* Resend Section */}
                        <div className="text-center space-y-3">
                            <p className="text-sm text-gray-600">
                                Vous n'avez pas reçu le code ?
                            </p>
                            
                            {canResend && timeLeft === 0 ? (
                                <Button
                                    variant="outline"
                                    onClick={onResend}
                                    disabled={isResending}
                                    className="w-full"
                                >
                                    {isResending ? (
                                        <div className="flex items-center space-x-2">
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            <span>Envoi en cours...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            <Mail className="w-4 h-4" />
                                            <span>Renvoyer le code</span>
                                        </div>
                                    )}
                                </Button>
                            ) : (
                                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                        Renvoyer dans {formatTime(timeLeft)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Help Text */}
                        <div className="text-center text-xs text-gray-500 space-y-1">
                            <p>Le code expire dans 15 minutes</p>
                            <p>Vérifiez votre dossier spam si vous ne le trouvez pas</p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default VerificationCodeInput;
