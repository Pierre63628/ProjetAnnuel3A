package com.esgi.scraper.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DatabaseConfig {
    public static final String URL = "jdbc:postgresql://37.59.118.112:5432/nextdoorbuddy";
    public static final String USER = "user";
    public static final String PASSWORD = "rootpass";
    public static final String DB_NAME = "nextdoorbuddy";


    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }
}
