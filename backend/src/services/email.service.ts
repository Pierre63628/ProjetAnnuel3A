import nodemailer from 'nodemailer';
import { User } from '../models/user.model.js';

interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
}

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export class EmailService {
    private transporter: nodemailer.Transporter;
    private fromEmail: string;
    private fromName: string;

    constructor() {
        this.fromEmail = process.env.FROM_EMAIL || 'noreply@doorbudy.cloud';
        this.fromName = process.env.FROM_NAME || 'DoorBudy';

        const config: EmailConfig = {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || ''
            }
        };

        this.transporter = nodemailer.createTransport(config);
    }

    /**
     * Send email verification code to user
     */
    async sendVerificationEmail(user: User, verificationCode: string): Promise<boolean> {
        try {
            const emailOptions: EmailOptions = {
                to: user.email,
                subject: 'Vérifiez votre adresse email - DoorBudy',
                html: this.getVerificationEmailTemplate(user.prenom || 'Utilisateur', verificationCode),
                text: this.getVerificationEmailText(user.prenom || 'Utilisateur', verificationCode)
            };

            await this.sendEmail(emailOptions);
            console.log(`✅ Email de vérification envoyé à ${user.email}`);
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi de l\'email de vérification:', error);
            return false;
        }
    }

    /**
     * Send welcome email after successful verification
     */
    async sendWelcomeEmail(user: User): Promise<boolean> {
        try {
            const emailOptions: EmailOptions = {
                to: user.email,
                subject: 'Bienvenue sur DoorBudy !',
                html: this.getWelcomeEmailTemplate(user.prenom || 'Utilisateur'),
                text: this.getWelcomeEmailText(user.prenom || 'Utilisateur')
            };

            await this.sendEmail(emailOptions);
            console.log(`✅ Email de bienvenue envoyé à ${user.email}`);
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de l\'envoi de l\'email de bienvenue:', error);
            return false;
        }
    }

    /**
     * Send email using configured transporter
     */
    private async sendEmail(options: EmailOptions): Promise<void> {
        const mailOptions = {
            from: `${this.fromName} <${this.fromEmail}>`,
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text
        };

        await this.transporter.sendMail(mailOptions);
    }

    /**
     * HTML template for verification email
     */
    private getVerificationEmailTemplate(prenom: string, code: string): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Vérification Email - DoorBudy</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .code-box { background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏠 DoorBudy</h1>
                    <p>Vérification de votre adresse email</p>
                </div>
                <div class="content">
                    <h2>Bonjour ${prenom},</h2>
                    <p>Bienvenue sur DoorBudy ! Pour finaliser votre inscription et accéder à votre compte, veuillez saisir ce code de vérification :</p>
                    
                    <div class="code-box">
                        <div class="code">${code}</div>
                        <p><small>Ce code expire dans 15 minutes</small></p>
                    </div>
                    
                    <p>Si vous n'avez pas créé de compte sur DoorBudy, vous pouvez ignorer cet email en toute sécurité.</p>
                    
                    <p>Merci de rejoindre notre communauté de voisins !</p>
                    
                    <p>Cordialement,<br>L'équipe DoorBudy</p>
                </div>
                <div class="footer">
                    <p>© 2024 DoorBudy. Tous droits réservés.</p>
                    <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Plain text version of verification email
     */
    private getVerificationEmailText(prenom: string, code: string): string {
        return `
Bonjour ${prenom},

Bienvenue sur DoorBudy ! Pour finaliser votre inscription, veuillez saisir ce code de vérification :

Code de vérification: ${code}

Ce code expire dans 15 minutes.

Si vous n'avez pas créé de compte sur DoorBudy, ignorez cet email.

Cordialement,
L'équipe DoorBudy

© 2024 DoorBudy. Tous droits réservés.
        `;
    }

    /**
     * HTML template for welcome email
     */
    private getWelcomeEmailTemplate(prenom: string): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bienvenue sur DoorBudy</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
                .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #667eea; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Bienvenue sur DoorBudy !</h1>
                    <p>Votre compte a été vérifié avec succès</p>
                </div>
                <div class="content">
                    <h2>Félicitations ${prenom} !</h2>
                    <p>Votre adresse email a été vérifiée et votre compte DoorBudy est maintenant actif. Vous pouvez dès maintenant profiter de toutes les fonctionnalités de notre plateforme :</p>
                    
                    <div class="feature">
                        <h3>🔄 Trocs entre voisins</h3>
                        <p>Échangez des objets avec vos voisins de quartier</p>
                    </div>
                    
                    <div class="feature">
                        <h3>📅 Événements locaux</h3>
                        <p>Participez aux événements de votre quartier</p>
                    </div>
                    
                    <div class="feature">
                        <h3>🛠️ Services de proximité</h3>
                        <p>Proposez ou trouvez des services dans votre voisinage</p>
                    </div>
                    
                    <div class="feature">
                        <h3>💬 Messagerie</h3>
                        <p>Communiquez facilement avec vos voisins</p>
                    </div>
                    
                    <p style="text-align: center;">
                        <a href="https://doorbudy.cloud" class="button">Commencer à explorer</a>
                    </p>
                    
                    <p>Merci de faire partie de la communauté DoorBudy !</p>
                    
                    <p>Cordialement,<br>L'équipe DoorBudy</p>
                </div>
                <div class="footer">
                    <p>© 2024 DoorBudy. Tous droits réservés.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Plain text version of welcome email
     */
    private getWelcomeEmailText(prenom: string): string {
        return `
Félicitations ${prenom} !

Votre adresse email a été vérifiée et votre compte DoorBudy est maintenant actif.

Vous pouvez dès maintenant profiter de toutes nos fonctionnalités :
- Trocs entre voisins
- Événements locaux  
- Services de proximité
- Messagerie avec vos voisins

Visitez https://doorbudy.cloud pour commencer à explorer.

Merci de faire partie de la communauté DoorBudy !

Cordialement,
L'équipe DoorBudy

© 2024 DoorBudy. Tous droits réservés.
        `;
    }

    /**
     * Test email configuration
     */
    async testConnection(): Promise<boolean> {
        try {
            await this.transporter.verify();
            console.log('✅ Configuration email valide');
            return true;
        } catch (error) {
            console.error('❌ Erreur de configuration email:', error);
            return false;
        }
    }
}

export default new EmailService();
