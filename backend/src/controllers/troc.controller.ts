import { Request, Response } from 'express';
import { AnnonceTrocModel, AnnonceTroc } from '../models/annonceTroc.model.js';
import { UserModel } from '../models/user.model.js';
import pool from '../config/db.js';

export const createTroc = async (req: Request, res: Response) => {
    try {
        // Vérifier que l'utilisateur est authentifié
        if (!(req as any).user || !(req as any).user.id) {
            return res.status(401).json({ message: 'Utilisateur non authentifié.' });
        }

        const utilisateurId = (req as any).user.id

        const user = await UserModel.findById(utilisateurId)
        if (!user || !user.quartier_id) {
            return res.status(400).json({ message: 'Utilisateur invalide ou non rattaché à un quartier.' })
        }

        // Gérer les images multiples
        const images = req.body.images ?
            (Array.isArray(req.body.images) ? req.body.images : [req.body.images]) :
            [];

        const newAnnonce: AnnonceTroc = {
            titre: req.body.titre,
            description: req.body.description,
            objet_propose: req.body.objet_propose,
            objet_recherche: req.body.objet_recherche,
            images: images,
            date_publication: new Date(),
            utilisateur_id: utilisateurId,
            quartier_id: user.quartier_id,
            statut: 'active',
            type_annonce: req.body.type_annonce || 'offre',
            prix: req.body.prix || null,
            budget_max: req.body.budget_max || null,
            etat_produit: req.body.etat_produit || null,
            categorie: req.body.categorie || null,
            urgence: req.body.urgence || null,
            mode_echange: req.body.mode_echange || 'vente',
            criteres_specifiques: req.body.criteres_specifiques || null,
            disponibilite: req.body.disponibilite || null,
        };

        const newId = await AnnonceTrocModel.create(newAnnonce)
        return res.status(201).json({ id: newId })
    } catch (error) {
        console.error('Erreur lors de la création de l\'annonce de troc :', error)
        return res.status(500).json({ message: 'Erreur serveur' })
    }
}

export const getTrocByUserQuartier = async (req: Request, res: Response) => {
    try {
        // Vérifier que l'utilisateur est authentifié pour connaître son quartier
        if (!(req as any).user || !(req as any).user.id) {
            return res.status(401).json({ message: 'Utilisateur non authentifié.' });
        }

        const utilisateurId = (req as any).user.id;

        // Récupérer le quartier de l'utilisateur
        const userResult = await pool.query(
            'SELECT quartier_id FROM "Utilisateur" WHERE id = $1',
            [utilisateurId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const userQuartierId = userResult.rows[0].quartier_id;

        if (!userQuartierId) {
            return res.status(400).json({ message: 'Utilisateur non assigné à un quartier' });
        }

        // Récupérer les trocs du même quartier avec les informations de l'utilisateur
        const result = await pool.query(`
            SELECT a.*, u.nom, u.prenom, q.nom_quartier
            FROM "AnnonceTroc" a
            JOIN "Utilisateur" u ON a.utilisateur_id = u.id
            JOIN "Quartier" q ON a.quartier_id = q.id
            WHERE a.quartier_id = $1 AND a.statut = 'active'
            ORDER BY a.date_publication DESC
        `, [userQuartierId]);

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des annonces de troc :', error)
        return res.status(500).json({ message: 'Erreur serveur' })
    }
};

export const getUserTrocs = async (req: Request, res: Response) => {
    try {
        // Vérifier que l'utilisateur est authentifié
        if (!(req as any).user || !(req as any).user.id) {
            return res.status(401).json({ message: 'Utilisateur non authentifié.' });
        }

        const utilisateurId = (req as any).user.id
        const annonces = await AnnonceTrocModel.findByUser(utilisateurId)
        return res.status(200).json(annonces)
    } catch (error) {
        console.error('Erreur lors de la récupération des annonces de l\'utilisateur :', error)
        return res.status(500).json({ message: 'Erreur serveur' })
    }
};

export const updateTroc = async (req: Request, res: Response) => {
    try {
        // Vérifier que l'utilisateur est authentifié
        if (!(req as any).user || !(req as any).user.id) {
            return res.status(401).json({ message: 'Utilisateur non authentifié.' });
        }

        const utilisateurId = (req as any).user.id
        const trocId = parseInt(req.params.id)

        // Vérifier que l'annonce appartient à l'utilisateur
        const existingTroc = await AnnonceTrocModel.findById(trocId)
        if (!existingTroc || existingTroc.utilisateur_id !== utilisateurId) {
            return res.status(403).json({ message: 'Accès non autorisé à cette annonce.' })
        }

        // Gérer les images multiples pour la mise à jour
        const images = req.body.images ?
            (Array.isArray(req.body.images) ? req.body.images : [req.body.images]) :
            [];

        const updatedData = {
            titre: req.body.titre,
            description: req.body.description,
            objet_propose: req.body.objet_propose,
            objet_recherche: req.body.objet_recherche,
            images: images,
            type_annonce: req.body.type_annonce,
            prix: req.body.prix || null,
            budget_max: req.body.budget_max || null,
            etat_produit: req.body.etat_produit || null,
            categorie: req.body.categorie || null,
            urgence: req.body.urgence || null,
            mode_echange: req.body.mode_echange || null,
            criteres_specifiques: req.body.criteres_specifiques || null,
            disponibilite: req.body.disponibilite || null,
        }

        const success = await AnnonceTrocModel.update(trocId, updatedData)
        if (success) {
            return res.status(200).json({ message: 'Annonce mise à jour avec succès' })
        } else {
            return res.status(404).json({ message: 'Annonce non trouvée' })
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'annonce :', error)
        return res.status(500).json({ message: 'Erreur serveur' })
    }
};

export const deleteTroc = async (req: Request, res: Response) => {
    try {
        // Vérifier que l'utilisateur est authentifié
        if (!(req as any).user || !(req as any).user.id) {
            return res.status(401).json({ message: 'Utilisateur non authentifié.' });
        }

        const utilisateurId = (req as any).user.id
        const trocId = parseInt(req.params.id)

        // Vérifier que l'annonce appartient à l'utilisateur
        const existingTroc = await AnnonceTrocModel.findById(trocId)
        if (!existingTroc || existingTroc.utilisateur_id !== utilisateurId) {
            return res.status(403).json({ message: 'Accès non autorisé à cette annonce.' })
        }

        const success = await AnnonceTrocModel.delete(trocId)
        if (success) {
            return res.status(200).json({ message: 'Annonce supprimée avec succès' })
        } else {
            return res.status(404).json({ message: 'Annonce non trouvée' })
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'annonce :', error)
        return res.status(500).json({ message: 'Erreur serveur' })
    }
};

// Contrôleurs admin
export const adminGetAllTrocs = async (req: Request, res: Response) => {
    try {
        const trocs = await AnnonceTrocModel.findAll();
        res.status(200).json(trocs);
    } catch (error) {
        console.error('Erreur lors de la récupération de toutes les annonces:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

export const adminUpdateTrocStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;

        if (!['active', 'inactive'].includes(statut)) {
            return res.status(400).json({ message: 'Statut invalide' });
        }

        const updated = await AnnonceTrocModel.updateStatus(parseInt(id), statut);
        if (!updated) {
            return res.status(404).json({ message: 'Annonce non trouvée' });
        }

        res.status(200).json({ message: 'Statut mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

export const adminGetTrocStats = async (req: Request, res: Response) => {
    try {
        const stats = await AnnonceTrocModel.getStats();
        res.status(200).json(stats);
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// Supprimer l'image d'un troc
export const removeTrocImage = async (req: Request, res: Response) => {
    try {
        // Vérifier que l'utilisateur est authentifié
        if (!(req as any).user || !(req as any).user.id) {
            return res.status(401).json({ message: 'Utilisateur non authentifié.' });
        }

        const utilisateurId = (req as any).user.id;
        const trocId = parseInt(req.params.id);
        const { imageUrl } = req.body; // URL de l'image à supprimer

        // Vérifier que l'annonce appartient à l'utilisateur
        const existingTroc = await AnnonceTrocModel.findById(trocId);

        if (!existingTroc || existingTroc.utilisateur_id !== utilisateurId) {
            return res.status(403).json({ message: 'Accès non autorisé à cette annonce.' });
        }

        // Si imageUrl est fourni, supprimer seulement cette image
        if (imageUrl) {
            const currentImages = existingTroc.images || [];
            const updatedImages = currentImages.filter(img => img !== imageUrl);

            const success = await AnnonceTrocModel.updateImages(trocId, updatedImages);
            if (success) {
                return res.status(200).json({
                    message: 'Image supprimée avec succès',
                    images: updatedImages
                });
            }
        } else {
            // Supprimer toutes les images si aucune URL spécifique n'est fournie
            const success = await AnnonceTrocModel.updateImages(trocId, []);
            if (success) {
                return res.status(200).json({
                    message: 'Toutes les images supprimées avec succès',
                    images: []
                });
            }
        }

        return res.status(404).json({ message: 'Annonce non trouvée' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'image du troc:', error);
        return res.status(500).json({ message: 'Erreur serveur' });
    }
};

