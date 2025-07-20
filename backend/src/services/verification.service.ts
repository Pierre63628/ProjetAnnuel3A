import { EmailVerificationModel, EmailVerification } from '../models/email-verification.model.js';
import { UserModel, User } from '../models/user.model.js';
import emailService from './email.service.js';

export interface VerificationResult {
    success: boolean;
    message: string;
    code?: string;
    remainingAttempts?: number;
}

export class VerificationService {
    /**
     * Create and send verification code to user
     */
    static async createAndSendVerificationCode(user: User): Promise<VerificationResult> {
        try {
            // Check rate limiting - max 3 emails per hour
            const recentAttempts = await EmailVerificationModel.countRecentAttempts(user.id!);
            const maxResendAttempts = parseInt(process.env.MAX_RESEND_ATTEMPTS || '3');
            
            if (recentAttempts >= maxResendAttempts) {
                return {
                    success: false,
                    message: `Trop de tentatives. Veuillez attendre avant de demander un nouveau code.`
                };
            }

            // Generate verification code
            const verificationCode = EmailVerificationModel.generateVerificationCode();
            const expiresAt = EmailVerificationModel.calculateExpirationTime();

            // Save verification code to database
            await EmailVerificationModel.create({
                user_id: user.id!,
                verification_code: verificationCode,
                expires_at: expiresAt
            });

            // Send email
            const emailSent = await emailService.sendVerificationEmail(user, verificationCode);
            
            if (!emailSent) {
                return {
                    success: false,
                    message: 'Erreur lors de l\'envoi de l\'email. Veuillez réessayer.'
                };
            }

            console.log(`✅ Code de vérification créé et envoyé pour l'utilisateur ${user.email}`);
            
            return {
                success: true,
                message: 'Code de vérification envoyé par email.',
                code: process.env.NODE_ENV === 'development' ? verificationCode : undefined
            };
        } catch (error) {
            console.error('Erreur lors de la création du code de vérification:', error);
            return {
                success: false,
                message: 'Erreur interne. Veuillez réessayer.'
            };
        }
    }

    /**
     * Verify email with provided code
     */
    static async verifyEmailWithCode(userId: number, code: string): Promise<VerificationResult> {
        try {
            // Find verification record
            const verification = await EmailVerificationModel.findByUserAndCode(userId, code);
            
            if (!verification) {
                return {
                    success: false,
                    message: 'Code de vérification invalide.'
                };
            }

            // Check if already used
            if (verification.is_used) {
                return {
                    success: false,
                    message: 'Ce code a déjà été utilisé.'
                };
            }

            // Check if expired
            if (EmailVerificationModel.isExpired(verification)) {
                return {
                    success: false,
                    message: 'Le code de vérification a expiré. Demandez un nouveau code.'
                };
            }

            // Check max attempts
            if (EmailVerificationModel.isMaxAttemptsReached(verification)) {
                return {
                    success: false,
                    message: 'Trop de tentatives incorrectes. Demandez un nouveau code.'
                };
            }

            // Verify the code
            if (verification.verification_code !== code) {
                // Increment attempts
                await EmailVerificationModel.incrementAttempts(verification.id!);
                
                const remainingAttempts = parseInt(process.env.MAX_VERIFICATION_ATTEMPTS || '3') - (verification.attempts + 1);
                
                return {
                    success: false,
                    message: `Code incorrect. ${remainingAttempts} tentative(s) restante(s).`,
                    remainingAttempts
                };
            }

            // Mark verification as used
            await EmailVerificationModel.markAsUsed(verification.id!);

            // Update user email verification status
            await UserModel.update(userId, {
                email_verified: true
            });

            // Update email_verified_at timestamp
            await this.updateEmailVerifiedAt(userId);

            // Clean up all verification codes for this user
            await EmailVerificationModel.deleteAllForUser(userId);

            // Get updated user for welcome email
            const user = await UserModel.findById(userId);
            if (user) {
                // Send welcome email (don't wait for it)
                emailService.sendWelcomeEmail(user).catch(error => {
                    console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
                });
            }

            console.log(`✅ Email vérifié avec succès pour l'utilisateur ${userId}`);

            return {
                success: true,
                message: 'Email vérifié avec succès ! Bienvenue sur DoorBudy.'
            };
        } catch (error) {
            console.error('Erreur lors de la vérification du code:', error);
            return {
                success: false,
                message: 'Erreur interne. Veuillez réessayer.'
            };
        }
    }

    /**
     * Check if user's email is verified
     */
    static async isEmailVerified(userId: number): Promise<boolean> {
        try {
            const user = await UserModel.findById(userId);
            return user?.email_verified === true;
        } catch (error) {
            console.error('Erreur lors de la vérification du statut email:', error);
            return false;
        }
    }

    /**
     * Get verification status for user
     */
    static async getVerificationStatus(userId: number): Promise<{
        isVerified: boolean;
        hasPendingVerification: boolean;
        canResendCode: boolean;
        nextResendTime?: Date;
    }> {
        try {
            const user = await UserModel.findById(userId);
            const isVerified = user?.email_verified === true;

            if (isVerified) {
                return {
                    isVerified: true,
                    hasPendingVerification: false,
                    canResendCode: false
                };
            }

            // Check for pending verification
            const latestVerification = await EmailVerificationModel.findLatestByUser(userId);
            const hasPendingVerification = latestVerification && 
                !latestVerification.is_used && 
                !EmailVerificationModel.isExpired(latestVerification);

            // Check if can resend code (rate limiting)
            const recentAttempts = await EmailVerificationModel.countRecentAttempts(userId);
            const maxResendAttempts = parseInt(process.env.MAX_RESEND_ATTEMPTS || '3');
            const canResendCode = recentAttempts < maxResendAttempts;

            let nextResendTime: Date | undefined;
            if (!canResendCode && latestVerification) {
                nextResendTime = new Date(latestVerification.created_at!);
                nextResendTime.setHours(nextResendTime.getHours() + 1);
            }

            return {
                isVerified: false,
                hasPendingVerification: !!hasPendingVerification,
                canResendCode,
                nextResendTime
            };
        } catch (error) {
            console.error('Erreur lors de la récupération du statut de vérification:', error);
            return {
                isVerified: false,
                hasPendingVerification: false,
                canResendCode: false
            };
        }
    }

    /**
     * Update email_verified_at timestamp
     */
    private static async updateEmailVerifiedAt(userId: number): Promise<void> {
        try {
            await pool.query(
                'UPDATE "Utilisateur" SET email_verified_at = NOW() WHERE id = $1',
                [userId]
            );
        } catch (error) {
            console.error('Erreur lors de la mise à jour de email_verified_at:', error);
        }
    }

    /**
     * Clean up expired verification codes (called periodically)
     */
    static async cleanupExpiredCodes(): Promise<number> {
        try {
            const deletedCount = await EmailVerificationModel.deleteExpired();
            if (deletedCount > 0) {
                console.log(`🧹 ${deletedCount} codes de vérification expirés supprimés`);
            }
            return deletedCount;
        } catch (error) {
            console.error('Erreur lors du nettoyage des codes expirés:', error);
            return 0;
        }
    }
}

// Import pool for the private method
import pool from '../config/db.js';

export default VerificationService;
