import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, FileText, Calendar, Shield, Users, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsAndConditions: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <div className="flex items-center mb-6">
                        <Button
                            variant="outline"
                            onClick={() => navigate(-1)}
                            className="mr-4 p-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center">
                            <FileText className="w-8 h-8 text-blue-600 mr-3" />
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    Conditions Générales d'Utilisation
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    NextDoorBuddy - Application de quartier
                                </p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
                        <CardHeader className="pb-6">
                            <div className="flex items-center text-sm text-gray-500 mb-4">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-8">
                            {/* Section 1 */}
                            <section>
                                <div className="flex items-center mb-4">
                                    <Users className="w-5 h-5 text-blue-600 mr-2" />
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        1. Objet et Acceptation
                                    </h2>
                                </div>
                                <div className="text-gray-700 space-y-3">
                                    <p>
                                        Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation 
                                        de l'application NextDoorBuddy, une plateforme de mise en relation entre voisins 
                                        d'un même quartier.
                                    </p>
                                    <p>
                                        En créant un compte sur NextDoorBuddy, vous acceptez sans réserve les présentes 
                                        conditions d'utilisation.
                                    </p>
                                </div>
                            </section>

                            {/* Section 2 */}
                            <section>
                                <div className="flex items-center mb-4">
                                    <Shield className="w-5 h-5 text-blue-600 mr-2" />
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        2. Services Proposés
                                    </h2>
                                </div>
                                <div className="text-gray-700 space-y-3">
                                    <p>NextDoorBuddy propose les services suivants :</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>Échange de services entre voisins</li>
                                        <li>Système de troc d'objets</li>
                                        <li>Organisation d'événements de quartier</li>
                                        <li>Messagerie instantanée sécurisée</li>
                                        <li>Gestion de profils utilisateurs</li>
                                    </ul>
                                </div>
                            </section>

                            {/* Section 3 */}
                            <section>
                                <div className="flex items-center mb-4">
                                    <Mail className="w-5 h-5 text-blue-600 mr-2" />
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        3. Obligations des Utilisateurs
                                    </h2>
                                </div>
                                <div className="text-gray-700 space-y-3">
                                    <p>En utilisant NextDoorBuddy, vous vous engagez à :</p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>Fournir des informations exactes et à jour</li>
                                        <li>Respecter les autres utilisateurs</li>
                                        <li>Ne pas publier de contenu inapproprié ou illégal</li>
                                        <li>Utiliser l'application dans le respect des lois en vigueur</li>
                                        <li>Maintenir la confidentialité de vos identifiants</li>
                                    </ul>
                                </div>
                            </section>

                            {/* Section 4 */}
                            <section>
                                <div className="flex items-center mb-4">
                                    <Shield className="w-5 h-5 text-blue-600 mr-2" />
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        4. Protection des Données
                                    </h2>
                                </div>
                                <div className="text-gray-700 space-y-3">
                                    <p>
                                        Vos données personnelles sont traitées conformément au Règlement Général 
                                        sur la Protection des Données (RGPD). Nous nous engageons à :
                                    </p>
                                    <ul className="list-disc list-inside space-y-2 ml-4">
                                        <li>Protéger vos données personnelles</li>
                                        <li>Ne pas les vendre à des tiers</li>
                                        <li>Vous permettre d'accéder, modifier ou supprimer vos données</li>
                                        <li>Utiliser vos données uniquement pour le fonctionnement du service</li>
                                    </ul>
                                </div>
                            </section>

                            {/* Section 5 */}
                            <section>
                                <div className="flex items-center mb-4">
                                    <FileText className="w-5 h-5 text-blue-600 mr-2" />
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        5. Responsabilité
                                    </h2>
                                </div>
                                <div className="text-gray-700 space-y-3">
                                    <p>
                                        NextDoorBuddy est une plateforme de mise en relation. Nous ne sommes pas 
                                        responsables des échanges entre utilisateurs, de la qualité des services 
                                        proposés ou des objets échangés.
                                    </p>
                                    <p>
                                        Chaque utilisateur est responsable de ses actions et de ses échanges 
                                        avec les autres membres de la communauté.
                                    </p>
                                </div>
                            </section>

                            {/* Contact */}
                            <section className="bg-blue-50 p-6 rounded-xl">
                                <div className="flex items-center mb-4">
                                    <Mail className="w-5 h-5 text-blue-600 mr-2" />
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Contact
                                    </h2>
                                </div>
                                <p className="text-gray-700">
                                    Pour toute question concernant ces conditions d'utilisation, 
                                    vous pouvez nous contacter à l'adresse : 
                                    <a 
                                        href="mailto:contact@nextdoorbuddy.com" 
                                        className="text-blue-600 hover:text-blue-700 font-medium ml-1"
                                    >
                                        doorbudy@gmail.com
                                    </a>
                                </p>
                            </section>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
};

export default TermsAndConditions;
