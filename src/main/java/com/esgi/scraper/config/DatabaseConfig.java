package com.esgi.scraper.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConfig {
    private static final String HOST = "localhost";
    private static final int PORT = 5432;
    public static final String DB_NAME = "events_db";
    public static final String USER = "user";
    public static final String PASSWORD = "rootpass";

    private static final String DB_URL = "jdbc:postgresql://" + HOST + ":" + PORT + "/" + DB_NAME;

    static {
        try {
            DatabaseInitializer.initialize();
        } catch (Exception e) {
            System.err.println("Erreur lors de l'initialisation de la base de données: " + e.getMessage());
        }
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(DB_URL, USER, PASSWORD);
    }
}
