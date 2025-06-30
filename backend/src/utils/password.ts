import crypto from 'crypto';

export const hashPassword = (plainPassword: string): string => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(plainPassword, salt, 10000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
};

export const verifyPassword = (plainPassword: string, hashedPassword: string): boolean => {
    // Support pour les anciens hashes bcrypt (commencent par $2)
    if (hashedPassword.startsWith('$2')) {
        // Pour les anciens hashes bcrypt, on ne peut pas les vérifier sans bcrypt
        // Il faudrait demander à l'utilisateur de se reconnecter pour mettre à jour son mot de passe
        console.warn('Ancien hash bcrypt détecté. Veuillez mettre à jour le mot de passe.');
        return false;
    }

    // Vérification avec crypto (nouveau format)
    if (hashedPassword.includes(':')) {
        const [salt, storedHash] = hashedPassword.split(':');
        const hash = crypto.pbkdf2Sync(plainPassword, salt, 10000, 64, 'sha512').toString('hex');
        return storedHash === hash;
    }

    return false;
};
