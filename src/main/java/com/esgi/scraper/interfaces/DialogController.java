package com.esgi.scraper.interfaces;

import javafx.scene.control.Alert;
import javafx.scene.control.ButtonType;
import javafx.stage.Stage;
import javafx.scene.control.Control;

import java.util.Optional;

public class DialogController {
    private final Control control;

    public DialogController(Control control) {
        this.control = control;
    }

    public void showAboutDialog() {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle("À propos");
        alert.setHeaderText("Event Viewer");
        alert.setContentText("Application de visualisation d'événements scrapés depuis différents sites.\n\nDéveloppé par des éléves de l'esgi.");
        alert.showAndWait();
    }

    public void handleExit() {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Quitter");
        alert.setHeaderText("Quitter l'application");
        alert.setContentText("Êtes-vous sûr de vouloir quitter l'application ?");

        Optional<ButtonType> result = alert.showAndWait();
        if (result.isPresent() && result.get() == ButtonType.OK) {
            Stage stage = (Stage) control.getScene().getWindow();
            stage.close();
        }
    }
}
