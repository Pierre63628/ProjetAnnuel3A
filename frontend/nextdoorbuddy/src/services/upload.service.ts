import { apiRequest } from './api';

export interface UploadResponse {
    message: string;
    imageUrl: string;
    filename: string;
}

export interface MultipleUploadResponse {
    message: string;
    imageUrls: string[];
    count: number;
}

class UploadService {
    // Upload d'une seule image
    async uploadImage(file: File): Promise<UploadResponse> {
        try {
            console.log('=== UPLOAD SERVICE: Début upload image ===');
            console.log('File:', file.name, file.size, file.type);
            
            const formData = new FormData();
            formData.append('image', file);

            console.log('FormData créé, envoi de la requête...');
            
            // Essayer d'abord avec la route normale (avec authentification)
            try {
                const accessToken = localStorage.getItem('accessToken');
                const headers: Record<string, string> = {};
                
                if (accessToken) {
                    headers['Authorization'] = `Bearer ${accessToken}`;
                }
                
                const response = await fetch('/api/upload/image', {
                    method: 'POST',
                    body: formData,
                    headers,
                });

                if (!response.ok) {
                    throw new Error(`Erreur upload: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                console.log('UPLOAD SERVICE: Réponse reçue:', data);
                
                // S'assurer que la réponse a la bonne structure
                if (!data.imageUrl) {
                    throw new Error('Réponse d\'upload invalide: URL d\'image manquante');
                }
                
                return data;
            } catch (authError: any) {
                console.log('UPLOAD SERVICE: Erreur d\'authentification, essai avec la route de test...');
                
                // Si erreur d'authentification, essayer la route de test
                const testResponse = await fetch('/api/upload/test', {
                    method: 'POST',
                    body: formData,
                });

                if (!testResponse.ok) {
                    throw new Error(`Erreur upload test: ${testResponse.status} ${testResponse.statusText}`);
                }

                const testData = await testResponse.json();
                console.log('UPLOAD SERVICE: Réponse test reçue:', testData);
                
                // S'assurer que la réponse a la bonne structure
                if (!testData.imageUrl) {
                    throw new Error('Réponse d\'upload invalide: URL d\'image manquante');
                }
                
                return testData;
            }
        } catch (error: any) {
            console.error('UPLOAD SERVICE: Erreur détaillée:', error);
            console.error('UPLOAD SERVICE: Message d\'erreur:', error.message);
            console.error('UPLOAD SERVICE: Stack trace:', error.stack);
            
            // Vérifier si c'est une erreur d'authentification
            if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
                throw new Error('Erreur d\'authentification. Veuillez vous reconnecter.');
            }
            
            throw new Error(`Erreur lors de l'upload de l'image: ${error.message}`);
        }
    }

    // Upload de plusieurs images
    async uploadMultipleImages(files: File[]): Promise<MultipleUploadResponse> {
        try {
            const formData = new FormData();
            files.forEach((file, index) => {
                formData.append('images', file);
            });

            const accessToken = localStorage.getItem('accessToken');
            const headers: Record<string, string> = {};
            
            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }

            const response = await fetch('/api/upload/images', {
                method: 'POST',
                body: formData,
                headers,
            });

            if (!response.ok) {
                throw new Error(`Erreur upload multiple: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Erreur lors de l\'upload des images:', error);
            throw new Error('Erreur lors de l\'upload des images');
        }
    }

    // Supprimer une image
    async deleteImage(filename: string): Promise<void> {
        try {
            await apiRequest(`/upload/image/${filename}`, {
                method: 'DELETE',
            });
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'image:', error);
            throw new Error('Erreur lors de la suppression de l\'image');
        }
    }

    // Construire l'URL complète de l'image
    getImageUrl(imageUrl: string): string {
        if (!imageUrl) return '';
        
        console.log('UPLOAD SERVICE: Construction URL pour:', imageUrl);
        
        if (imageUrl.startsWith('http')) {
            console.log('UPLOAD SERVICE: URL externe:', imageUrl);
            return imageUrl;
        }
        
        // Pour les images uploadées, utiliser directement le proxy Vite
        if (imageUrl.startsWith('/uploads/')) {
            console.log('UPLOAD SERVICE: URL uploadée:', imageUrl);
            return imageUrl;
        }
        
        console.log('UPLOAD SERVICE: URL par défaut:', imageUrl);
        return imageUrl;
    }
}

const uploadService = new UploadService();
export default uploadService; 