package com.esgi.scraper.interfaces;

import com.esgi.scraper.plugins.PluginManager;
import com.esgi.scraper.plugins.PluginManager.ThemeMenuHandler;
import com.esgi.scraper.plugins.ThemePlugin;
import javafx.scene.control.*;
import javafx.stage.FileChooser;

import java.io.File;
import java.util.List;

public class ThemeMenuController implements ThemeMenuHandler {
    private final Control control;

    public ThemeMenuController(Control control) {
        this.control = control;
    }

    @Override
    public void setupThemeMenu(List<ThemePlugin> availableThemes) {
        Menu themeMenu = null;

        if (control.getScene() == null) {
            System.err.println("Erreur: Le contrôle n'est pas encore attaché à une scène.");
            return;
        }

        MenuBar menuBar = (MenuBar) control.getScene().getRoot().lookup(".menu-bar");
        if (menuBar != null) {
            for (Menu menu : menuBar.getMenus()) {
                if ("Thèmes".equals(menu.getText())) {
                    themeMenu = menu;
                    break;
                }
            }

            if (themeMenu == null) {
                themeMenu = new Menu("Thèmes");
                menuBar.getMenus().add(themeMenu);
            } else {
                themeMenu.getItems().clear();
            }

            MenuItem loadPluginItem = new MenuItem("Charger un plugin...");
            loadPluginItem.setOnAction(e -> handleLoadPlugin());
            themeMenu.getItems().add(loadPluginItem);

            themeMenu.getItems().add(new SeparatorMenuItem());

            for (ThemePlugin theme : availableThemes) {
                MenuItem themeItem = new MenuItem(theme.getName());
                themeItem.setOnAction(e -> {
                    PluginManager.getInstance().setTheme(theme);
                });
                themeMenu.getItems().add(themeItem);
            }
        }
    }

    private void handleLoadPlugin() {
        FileChooser fileChooser = new FileChooser();
        fileChooser.setTitle("Charger un plugin de thème");
        fileChooser.getExtensionFilters().add(
                new FileChooser.ExtensionFilter("Fichiers JAR", "*.jar")
        );

        File selectedFile = fileChooser.showOpenDialog(control.getScene().getWindow());

        if (selectedFile != null) {
            ThemePlugin loadedPlugin = PluginManager.getInstance().loadThemePluginFromJar(selectedFile);

            if (loadedPlugin != null) {
                Alert alert = new Alert(Alert.AlertType.INFORMATION);
                alert.setTitle("Plugin chargé");
                alert.setHeaderText("Plugin de thème chargé avec succès");
                alert.setContentText("Le plugin \"" + loadedPlugin.getName() + "\" a été chargé.\n" +
                        "Vous pouvez maintenant l'appliquer depuis le menu Thèmes.");
                alert.showAndWait();

                setupThemeMenu(PluginManager.getInstance().getAvailableThemes());
            } else {
                Alert alert = new Alert(Alert.AlertType.ERROR);
                alert.setTitle("Erreur");
                alert.setHeaderText("Erreur lors du chargement du plugin");
                alert.setContentText("Le fichier sélectionné ne contient pas de plugin de thème valide.");
                alert.showAndWait();
            }
        }
    }
}
