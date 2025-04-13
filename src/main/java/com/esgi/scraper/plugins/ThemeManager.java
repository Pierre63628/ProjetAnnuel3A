package com.esgi.scraper.plugins;

import javafx.scene.Scene;
import javafx.scene.control.Alert;

import java.util.ArrayList;
import java.util.List;


public class ThemeManager {

    private static ThemeManager instance;
    private final List<ThemePlugin> availableThemes;
    private ThemePlugin currentTheme;
    private Scene scene;

    private ThemeManager() {
        PluginLoader pluginLoader = new PluginLoader();
        availableThemes = pluginLoader.loadThemePlugins();

        if (!availableThemes.isEmpty()) {
            currentTheme = availableThemes.get(0);
        }
    }

    public static synchronized ThemeManager getInstance() {
        if (instance == null) {
            instance = new ThemeManager();
        }
        return instance;
    }

    public void setScene(Scene scene) {
        this.scene = scene;
        applyCurrentTheme();
    }

    public List<ThemePlugin> getAvailableThemes() {
        return new ArrayList<>(availableThemes);
    }

    public ThemePlugin getCurrentTheme() {
        return currentTheme;
    }

    public boolean addTheme(ThemePlugin theme) {
        if (theme == null) {
            return false;
        }

        for (ThemePlugin existingTheme : availableThemes) {
            if (existingTheme.getName().equals(theme.getName())) {
                return false;
            }
        }

        // Ajouter le thème
        availableThemes.add(theme);
        return true;
    }

    public boolean setTheme(ThemePlugin theme) {
        if (theme == null || !availableThemes.contains(theme)) {
            return false;
        }

        currentTheme = theme;
        return applyCurrentTheme();
    }

    private boolean applyCurrentTheme() {
        if (scene == null || currentTheme == null) {
            return false;
        }

        try {
            scene.getStylesheets().clear();
            String stylesheetPath = currentTheme.getStylesheetPath();
            scene.getStylesheets().add(getClass().getResource(stylesheetPath).toExternalForm());

            System.out.println("Thème appliqué: " + currentTheme.getName());
            return true;
        } catch (Exception e) {
            System.err.println("Erreur lors de l'application du thème: " + e.getMessage());

            Alert alert = new Alert(Alert.AlertType.ERROR);
            alert.setTitle("Erreur de thème");
            alert.setHeaderText("Impossible d'appliquer le thème");
            alert.setContentText("Une erreur s'est produite lors de l'application du thème: " + e.getMessage());
            alert.showAndWait();

            return false;
        }
    }
}
