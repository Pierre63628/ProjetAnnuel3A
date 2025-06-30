package com.esgi.scraper.repository;

import com.esgi.scraper.config.DatabaseConfig;
import com.esgi.scraper.models.Event;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class EventRepository {


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
                System.out.println("Colonne detailed_address ajoutée à la table events");
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

            System.out.println("Database schema initialized successfully.");
        } catch (SQLException e) {
            System.err.println("Error creating table: " + e.getMessage());
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
            System.out.println("Cleaned up " + deletedCount + " old events from database.");
            return deletedCount;
        } catch (SQLException e) {
            System.err.println("Error cleaning up old events: " + e.getMessage());
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
            System.err.println("Error counting events: " + e.getMessage());
            return 0;
        }
    }


    public List<Event> getAllEvents() {
        String sql = """
        SELECT id, nom, description, url, photo_url, date_evenement, 
               lieu, type_evenement, source, detailed_address,
               created_at, updated_at
        FROM "Evenement"
        ORDER BY date_evenement DESC
    """;

        List<Event> events = new ArrayList<>();

        try (Connection conn = DatabaseConfig.getConnection();
             var stmt = conn.createStatement();
             var rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                Event event = new Event();

                event.setEventId(String.valueOf(rs.getInt("id")));
                event.setName(rs.getString("nom"));
                event.setDescription(rs.getString("description"));
                event.setUrl(rs.getString("url"));
                event.setPhotoUrl(rs.getString("photo_url"));
                event.setDate(rs.getTimestamp("date_evenement").toString());
                event.setLocation(rs.getString("lieu"));
                event.setCategory(rs.getString("type_evenement"));
                event.setSource(rs.getString("source"));
                event.setDetailedAddress(rs.getString("detailed_address"));

                events.add(event);
            }

            System.out.println("Loaded " + events.size() + " events from database.");
            return events;

        } catch (SQLException e) {
            System.err.println("Error loading events from database: " + e.getMessage());
            return new ArrayList<>();
        }
    }

}

