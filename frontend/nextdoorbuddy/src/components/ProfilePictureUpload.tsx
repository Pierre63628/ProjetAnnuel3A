import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Upload, X,  Loader2 } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';

interface ProfilePictureUploadProps {
    currentPicture?: string | null;
    onPictureChange: (imageUrl: string | null) => void;
    userName?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    disabled?: boolean;
    className?: string;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
    currentPicture,
    onPictureChange,
    userName = '',
    size = 'lg',
    disabled = false,
    className = ''
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Size configurations
    const sizeConfig = {
        sm: { container: 'w-16 h-16', text: 'text-sm', icon: 'w-4 h-4' },
        md: { container: 'w-24 h-24', text: 'text-base', icon: 'w-5 h-5' },
        lg: { container: 'w-32 h-32', text: 'text-lg', icon: 'w-6 h-6' },
        xl: { container: 'w-40 h-40', text: 'text-xl', icon: 'w-8 h-8' }
    };

    const config = sizeConfig[size];

    // Get user initials for fallback
    const getInitials = (name: string) => {
        if (!name || typeof name !== 'string') return '?';

        const parts = name.trim().split(' ').filter(part => part.length > 0);

        if (parts.length >= 2) {
            // Get first and last name initials
            const firstInitial = parts[0].charAt(0);
            const lastInitial = parts[parts.length - 1].charAt(0);
            return (firstInitial + lastInitial).toUpperCase();
        } else if (parts.length === 1) {
            // Get first two characters of single name
            return parts[0].substring(0, 2).toUpperCase();
        }

        return '?';
    };

    const userInitials = getInitials(userName);

    // Handle file selection
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setUploadError('Veuillez sélectionner un fichier image valide');
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setUploadError('La taille du fichier ne doit pas dépasser 5MB');
            return;
        }

        setUploadError('');
        uploadImage(file);
    };

    // Upload image to server
    const uploadImage = async (file: File) => {
        setIsUploading(true);
        setUploadError('');

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors de l\'upload');
            }

            const data = await response.json();
            const imageUrl = data.imageUrl;

            // Set preview and notify parent
            setPreviewUrl(getImageUrl(imageUrl));
            onPictureChange(imageUrl);

        } catch (error) {
            console.error('Upload error:', error);
            setUploadError(error instanceof Error ? error.message : 'Erreur lors de l\'upload');
        } finally {
            setIsUploading(false);
        }
    };

    // Remove current picture
    const handleRemovePicture = () => {
        setPreviewUrl(null);
        onPictureChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Get current image URL
    const getCurrentImageUrl = () => {
        if (previewUrl) return previewUrl;
        if (currentPicture) return getImageUrl(currentPicture);
        return null;
    };

    const currentImageUrl = getCurrentImageUrl();

    return (
        <div className={`flex flex-col items-center space-y-4 ${className}`}>
            {/* Profile Picture Display */}
            <div className="relative group">
                <div className={`${config.container} rounded-full overflow-hidden border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center relative`}>
                    {currentImageUrl ? (
                        <img
                            src={currentImageUrl}
                            alt="Photo de profil"
                            className="w-full h-full object-cover"
                            onError={() => {
                                setPreviewUrl(null);
                                setUploadError('Erreur lors du chargement de l\'image');
                            }}
                        />
                    ) : (
                        <span className={`text-white font-bold ${config.text}`}>
                            {userInitials}
                        </span>
                    )}

                    {/* Loading overlay */}
                    {isUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                            <Loader2 className={`${config.icon} text-white animate-spin`} />
                        </div>
                    )}

                    {/* Hover overlay */}
                    {!disabled && !isUploading && (
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                            <Camera className={`${config.icon} text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
                        </div>
                    )}
                </div>

                {/* Remove button */}
                {currentImageUrl && !disabled && !isUploading && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleRemovePicture}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                        type="button"
                    >
                        <X className="w-4 h-4" />
                    </motion.button>
                )}
            </div>

            {/* Upload Controls */}
            {!disabled && (
                <div className="flex flex-col items-center space-y-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isUploading}
                    />

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                    >
                        {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Upload className="w-4 h-4" />
                        )}
                        <span>
                            {isUploading ? 'Upload...' : currentImageUrl ? 'Changer la photo' : 'Ajouter une photo'}
                        </span>
                    </motion.button>

                    <p className="text-xs text-gray-500 text-center max-w-xs">
                        Formats acceptés: JPG, PNG, GIF, WebP<br />
                        Taille maximale: 5MB
                    </p>
                </div>
            )}

            {/* Error Message */}
            {uploadError && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-600 text-sm text-center bg-red-50 px-3 py-2 rounded-lg border border-red-200"
                >
                    {uploadError}
                </motion.div>
            )}
        </div>
    );
};

export default ProfilePictureUpload;
