package com.esgi.scraper.launcher;

import com.esgi.scraper.config.DatabaseInitializer;
import com.esgi.scraper.interfaces.EventViewerApplication;
import lombok.extern.log4j.Log4j2;

@Log4j2
public class Launcher {
    public static void main(String[] args) {
        try {
            log.info("Initialisation de la base de données...");
            DatabaseInitializer.initialize();
            log.info("Base de données initialisée avec succès.");
        } catch (Exception e) {
            log.error("Erreur lors de l'initialisation de la base de données: " + e.getMessage());
        }
        EventViewerApplication.main(args);
    }
}