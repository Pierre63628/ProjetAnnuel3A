package com.esgi.scraper.config;

import lombok.extern.log4j.Log4j2;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

@Log4j2
public class DatabaseInitializer {
    private static final String HOST = "localhost";
    private static final int PORT = 5432;
    private static final String DB_NAME = DatabaseConfig.DB_NAME;
    private static final String SCHEMA_NAME = "public";
    private static final String USER = DatabaseConfig.USER;
    private static final String PASSWORD = DatabaseConfig.PASSWORD;

    private static final String POSTGRES_URL = "jdbc:postgresql://" + HOST + ":" + PORT + "/postgres";
    private static final String DB_URL = "jdbc:postgresql://" + HOST + ":" + PORT + "/" + DB_NAME;

    public static void initialize() {
        try {
            if (!databaseExists()) {
                createDatabase();
            }

            if (!schemaExists()) {
                createSchema();
            }

            System.out.println("Base de données et schéma initialisés avec succès.");
        } catch (SQLException e) {
            System.out.println("Erreur lors de l'initialisation de la base de données: " + e.getMessage());
        }
    }

    private static boolean databaseExists() throws SQLException {
        try (Connection conn = DriverManager.getConnection(POSTGRES_URL, USER, PASSWORD);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT 1 FROM pg_database WHERE datname = '" + DB_NAME + "'")) {

            return rs.next();
        }
    }

    private static void createDatabase() throws SQLException {
        try (Connection conn = DriverManager.getConnection(POSTGRES_URL, USER, PASSWORD);
             Statement stmt = conn.createStatement()) {

            stmt.execute("CREATE DATABASE " + DB_NAME);
            System.out.println("Base de données '" + DB_NAME + "' créée avec succès.");
        }
    }

    private static boolean schemaExists() throws SQLException {
        try (Connection conn = DriverManager.getConnection(DB_URL, USER, PASSWORD);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT 1 FROM information_schema.schemata WHERE schema_name = '" + SCHEMA_NAME + "'")) {

            return rs.next();
        }
    }

    private static void createSchema() throws SQLException {
        try (Connection conn = DriverManager.getConnection(DB_URL, USER, PASSWORD);
             Statement stmt = conn.createStatement()) {

            stmt.execute("CREATE SCHEMA " + SCHEMA_NAME);
            System.out.println("Schéma '" + SCHEMA_NAME + "' créé avec succès.");
        }
    }
}
