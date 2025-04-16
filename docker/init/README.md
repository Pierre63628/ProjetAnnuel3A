# Scripts d'initialisation de la base de données

Ce dossier contient les scripts SQL qui sont exécutés automatiquement lors de l'initialisation de la base de données PostgreSQL.

## Convention de nommage

Les scripts sont exécutés dans l'ordre alphabétique, d'où l'importance du préfixe numérique :

- `01_schema.sql` : Création des tables et des structures de base de données
- `02_seed.sql` : Insertion des données de test (quartiers, utilisateurs, etc.)

## Utilisation en développement

Ces scripts sont utilisés uniquement pour le développement local. En production, une base de données réelle sera utilisée.

## Exécution manuelle

Si vous avez besoin de réinitialiser la base de données, vous pouvez exécuter les commandes suivantes :

```bash
# Arrêter et supprimer les conteneurs
docker-compose down

# Supprimer le volume de la base de données
docker volume rm projetannuel-nextdoorbuddy_db_data

# Redémarrer les conteneurs (les scripts seront exécutés automatiquement)
docker-compose up -d
```
