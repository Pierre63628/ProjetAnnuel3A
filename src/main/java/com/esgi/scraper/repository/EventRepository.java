package com.esgi.scraper.repository;

import com.esgi.scraper.config.DatabaseConfig;
import com.esgi.scraper.models.Event;
import lombok.extern.log4j.Log4j2;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;


@Log4j2
public class EventRepository {

    public EventRepository() {
        // Créer le schéma et la table au moment de l'instanciation du repository
        createSchemaIfNotExists();
        createTableIfNotExists();
    }

    public void createSchemaIfNotExists() {
        String sql = """
                CREATE SCHEMA IF NOT EXISTS public
            """;
        try (Connection conn = DatabaseConfig.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
        } catch (SQLException e) {
            log.info("Error creating schema: " + e.getMessage());
        }
    }

    public void createTableIfNotExists() {
        String sql = """
                CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                url TEXT NOT NULL,
                image_url TEXT,
                date VARCHAR(100),
                source VARCHAR(50),
                detailed_address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                coordinates TEXT,
                CONSTRAINT unique_event_url UNIQUE (url)
                )
               """;
        try (Connection conn = DatabaseConfig.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute(sql);

            // Vérifier si la colonne updated_at existe déjà
            String checkUpdatedAtSql = """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'events' AND column_name = 'updated_at'
            """;

            boolean updatedAtExists = false;
            try (var rs = stmt.executeQuery(checkUpdatedAtSql)) {
                updatedAtExists = rs.next();
            }

            // Ajouter la colonne updated_at si elle n'existe pas
            if (!updatedAtExists) {
                String alterTableSql = "ALTER TABLE events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP";
                stmt.execute(alterTableSql);
            }

            // Vérifier si la colonne detailed_address existe déjà
            String checkAddressSql = """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'events' AND column_name = 'detailed_address'
            """;

            boolean addressExists = false;
            try (var rs = stmt.executeQuery(checkAddressSql)) {
                addressExists = rs.next();
            }

            // Ajouter la colonne detailed_address si elle n'existe pas
            if (!addressExists) {
                String alterTableSql = "ALTER TABLE events ADD COLUMN IF NOT EXISTS detailed_address TEXT";
                stmt.execute(alterTableSql);
                log.debug("Colonne detailed_address ajoutée à la table events");
            }

            // Vérifier si la colonne coordinates existe déjà
            String checkCoordinatesSql = """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'events' AND column_name = 'coordinates'
            """;

            boolean coordinatesExists = false;
            try (var rs = stmt.executeQuery(checkCoordinatesSql)) {
                coordinatesExists = rs.next();
            }

            // Ajouter la colonne coordinates si elle n'existe pas
            if (!coordinatesExists) {
                String alterTableSql = "ALTER TABLE events ADD COLUMN IF NOT EXISTS coordinates TEXT";
                stmt.execute(alterTableSql);
                log.debug("Colonne coordinates ajoutée à la table events");
            }

            // Créer un trigger pour mettre à jour updated_at automatiquement
            String createTriggerFunctionSql = """
                CREATE OR REPLACE FUNCTION update_modified_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = CURRENT_TIMESTAMP;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;
            """;

            String createTriggerSql = """
                DROP TRIGGER IF EXISTS update_events_updated_at ON events;
                CREATE TRIGGER update_events_updated_at
                BEFORE UPDATE ON events
                FOR EACH ROW
                EXECUTE FUNCTION update_modified_column();
            """;

            stmt.execute(createTriggerFunctionSql);
            stmt.execute(createTriggerSql);

            log.debug("Database schema initialized successfully.");
        } catch (SQLException e) {
           log.error("Error creating table: " + e.getMessage());
        }
    }


    public int cleanupOldEvents(int daysToKeep) {
        String sql = """
            DELETE FROM events
            WHERE date < NOW() - INTERVAL '? days'
        """;

        try (Connection conn = DatabaseConfig.getConnection();
             var pstmt = conn.prepareStatement(sql.replace("?", String.valueOf(daysToKeep)))) {

            int deletedCount = pstmt.executeUpdate();
            log.debug("Cleaned up " + deletedCount + " old events from database.");
            return deletedCount;
        } catch (SQLException e) {
           log.error("Error cleaning up old events: " + e.getMessage());
            return 0;
        }
    }


    public int countEvents() {
        String sql = "SELECT COUNT(*) FROM events";

        try (Connection conn = DatabaseConfig.getConnection();
             var stmt = conn.createStatement();
             var rs = stmt.executeQuery(sql)) {

            if (rs.next()) {
                return rs.getInt(1);
            }
            return 0;
        } catch (SQLException e) {
           log.error("Error counting events: " + e.getMessage());
            return 0;
        }
    }


    public List<Event> getAllEvents() {
        String sql = """
            SELECT id, name, url, image_url, date, source, detailed_address, coordinates,
                   created_at, updated_at
            FROM events
            ORDER BY date DESC
        """;

        List<com.esgi.scraper.models.Event> events = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             var stmt = conn.createStatement();
             var rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                com.esgi.scraper.models.Event event = new com.esgi.scraper.models.Event();
                event.setName(rs.getString("name"));
                event.setUrl(rs.getString("url"));
                // Convertir l'URL de l'image si elle existe
                String imageUrl = rs.getString("image_url");
                if (imageUrl != null && !imageUrl.isEmpty()) {
                    // TODO: Charger l'image si nécessaire
                }
                event.setDate(rs.getString("date"));
                event.setDetailedAddress(rs.getString("detailed_address"));
                event.setCoordinates(rs.getString("coordinates"));
                event.setCategory(rs.getString("source")); // Utiliser la source comme catégorie

                events.add(event);
            }

            log.debug("Loaded " + events.size() + " events from database.");
            return events;
        } catch (SQLException e) {
           log.error("Error loading events from database: " + e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Récupère les événements d'une source spécifique
     * @param source La source des événements (eventbrite, allevent, meetup)
     * @return Liste des événements de cette source
     */
    public List<com.esgi.scraper.models.Event> getEventsBySource(String source) {
        String sql = """
            SELECT id, name, url, image_url, date, source, detailed_address, coordinates,
                   created_at, updated_at
            FROM events
            WHERE source = ?
            ORDER BY date DESC
        """;

        List<com.esgi.scraper.models.Event> events = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             var pstmt = conn.prepareStatement(sql)) {

            pstmt.setString(1, source);

            try (var rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    com.esgi.scraper.models.Event event = new com.esgi.scraper.models.Event();
                    event.setName(rs.getString("name"));
                    event.setUrl(rs.getString("url"));
                    // Convertir l'URL de l'image si elle existe
                    String imageUrl = rs.getString("image_url");
                    if (imageUrl != null && !imageUrl.isEmpty()) {
                        // TODO: Charger l'image si nécessaire
                    }
                    event.setDate(rs.getString("date"));
                    event.setDetailedAddress(rs.getString("detailed_address"));
                    event.setCoordinates(rs.getString("coordinates"));
                    event.setCategory(rs.getString("source")); // Utiliser la source comme catégorie

                    events.add(event);
                }
            }

            log.debug("Loaded " + events.size() + " events from database for source: " + source);
            return events;
        } catch (SQLException e) {
           log.error("Error loading events from database: " + e.getMessage());
            return new ArrayList<>();
        }
    }
}

