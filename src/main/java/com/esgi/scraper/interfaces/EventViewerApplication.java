package com.esgi.scraper.interfaces;

import com.esgi.scraper.plugins.PluginManager;
import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.stage.Stage;

import java.io.IOException;

public class EventViewerApplication extends Application {


    @Override
    public void start(Stage stage) throws IOException {
        // Charger l'interface principale
        FXMLLoader fxmlLoader = new FXMLLoader(EventViewerApplication.class.getResource("/eventViewer.fxml"));
        Scene scene = new Scene(fxmlLoader.load(), 1200, 900);
        stage.setTitle("Event Viewer - Visualiseur d'Événements");
        stage.setScene(scene);
        stage.show();


        PluginManager pluginManager = PluginManager.getInstance();
        EventViewController controller = fxmlLoader.getController();
        pluginManager.initializePlugins(scene);
        pluginManager.setupThemeMenu(controller);
    }



    public static void main(String[] args) {
        launch();
    }
}
