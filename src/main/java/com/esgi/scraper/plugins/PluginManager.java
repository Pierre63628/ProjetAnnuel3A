package com.esgi.scraper.plugins;

import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.VBox;
import javafx.stage.Modality;
import javafx.stage.Stage;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.Enumeration;
import java.util.List;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;

/**
 * Gestionnaire central des plugins pour l'application
 * Cette classe s'occupe de l'initialisation, du chargement et de la gestion des plugins
 */
public class PluginManager {

    private static PluginManager instance;
    private final PluginLoader pluginLoader;
    private final ThemeManager themeManager;

    private PluginManager() {
        File pluginsDir = new File("plugins");
        if (!pluginsDir.exists()) {
            pluginsDir.mkdirs();
            System.out.println("Répertoire des plugins créé: " + pluginsDir.getAbsolutePath());
        }

        pluginLoader = new PluginLoader();
        themeManager = ThemeManager.getInstance();
    }

    public static synchronized PluginManager getInstance() {
        if (instance == null) {
            instance = new PluginManager();
        }
        return instance;
    }

    public void initializePlugins(Scene scene) {
        themeManager.setScene(scene);
        List<ThemePlugin> availableThemes = themeManager.getAvailableThemes();
        if (availableThemes.size() > 1) {
            showThemeSelectionDialog(availableThemes);
        }
    }

    public void setupThemeMenu(ThemeMenuHandler controller) {
        List<ThemePlugin> availableThemes = themeManager.getAvailableThemes();
        controller.setupThemeMenu(availableThemes);
    }

    public boolean setTheme(ThemePlugin theme) {
        return themeManager.setTheme(theme);
    }

    public ThemePlugin getCurrentTheme() {
        return themeManager.getCurrentTheme();
    }

    public List<ThemePlugin> getAvailableThemes() {
        return themeManager.getAvailableThemes();
    }

    public ThemePlugin loadThemePluginFromJar(File jarFile) {
        if (jarFile == null || !jarFile.exists() || !jarFile.getName().endsWith(".jar")) {
            return null;
        }

        try {
            JarFile jar = new JarFile(jarFile);
            URL[] urls = { new URL("jar:file:" + jarFile.getAbsolutePath() + "!/") };
            URLClassLoader classLoader = new URLClassLoader(urls, getClass().getClassLoader());

            Enumeration<JarEntry> entries = jar.entries();
            while (entries.hasMoreElements()) {
                JarEntry entry = entries.nextElement();
                if (entry.getName().endsWith(".class")) {
                    String className = entry.getName().replace('/', '.').replace('\\', '.').replace(".class", "");

                    try {
                        Class<?> clazz = classLoader.loadClass(className);
                        if (ThemePlugin.class.isAssignableFrom(clazz) && !clazz.isInterface()) {
                            ThemePlugin plugin = (ThemePlugin) clazz.getDeclaredConstructor().newInstance();
                            themeManager.addTheme(plugin);
                            System.out.println("Plugin de thème chargé: " + plugin.getName() + " (" + plugin.getVersion() + ")");
                            jar.close();
                            return plugin;
                        }
                    } catch (Exception e) {
                        System.err.println("Erreur lors du chargement de la classe " + className + ": " + e.getMessage());
                    }
                }
            }

            jar.close();
        } catch (IOException e) {
            System.err.println("Erreur lors du chargement du plugin " + jarFile.getName() + ": " + e.getMessage());
        }

        return null;
    }

    private void showThemeSelectionDialog(List<ThemePlugin> themes) {
        Stage dialogStage = new Stage();
        dialogStage.initModality(Modality.APPLICATION_MODAL);
        dialogStage.setTitle("Sélection du thème");
        dialogStage.setMinWidth(400);
        dialogStage.setMinHeight(300);

        ListView<ThemePlugin> themeListView = new ListView<>();
        themeListView.getItems().addAll(themes);
        themeListView.setCellFactory(param -> new ListCell<>() {
            @Override
            protected void updateItem(ThemePlugin theme, boolean empty) {
                super.updateItem(theme, empty);
                if (empty || theme == null) {
                    setText(null);
                } else {
                    setText(theme.getName() + " (" + theme.getVersion() + ") - " + theme.getAuthor());
                }
            }
        });
        themeListView.getSelectionModel().select(0);

        // Ajouter une zone de description
        TextArea descriptionArea = new TextArea();
        descriptionArea.setEditable(false);
        descriptionArea.setWrapText(true);
        descriptionArea.setPrefHeight(100);

        // Mettre à jour la description lorsqu'un thème est sélectionné
        themeListView.getSelectionModel().selectedItemProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null) {
                descriptionArea.setText(newVal.getDescription());
            }
        });

        // Déclencher la mise à jour initiale
        if (!themes.isEmpty()) {
            descriptionArea.setText(themes.get(0).getDescription());
        }

        // Boutons
        Button applyButton = new Button("Appliquer");
        Button cancelButton = new Button("Annuler");

        // Gestionnaires d'événements
        applyButton.setOnAction(e -> {
            ThemePlugin selectedTheme = themeListView.getSelectionModel().getSelectedItem();
            if (selectedTheme != null) {
                themeManager.setTheme(selectedTheme);
            }
            dialogStage.close();
        });

        cancelButton.setOnAction(e -> dialogStage.close());

        // Mise en page
        VBox buttonsBox = new VBox(10, applyButton, cancelButton);
        buttonsBox.setAlignment(Pos.CENTER);

        VBox dialogVBox = new VBox(10);
        dialogVBox.setPadding(new Insets(20));
        dialogVBox.getChildren().addAll(
                new Label("Sélectionnez un thème :"),
                themeListView,
                new Label("Description :"),
                descriptionArea,
                buttonsBox
        );

        Scene dialogScene = new Scene(dialogVBox);
        dialogStage.setScene(dialogScene);
        dialogStage.showAndWait();
    }

    public interface ThemeMenuHandler {
        void setupThemeMenu(List<ThemePlugin> availableThemes);
    }
}
