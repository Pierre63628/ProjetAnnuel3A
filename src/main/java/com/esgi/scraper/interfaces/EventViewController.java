package com.esgi.scraper.interfaces;

import com.esgi.scraper.models.Event;
import com.esgi.scraper.plugins.PluginManager;
import com.esgi.scraper.plugins.PluginManager.ThemeMenuHandler;
import com.esgi.scraper.plugins.ThemePlugin;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.*;
import javafx.scene.image.ImageView;
import javafx.scene.control.DatePicker;

import java.net.URL;
import java.util.List;
import java.util.ResourceBundle;

public class EventViewController implements Initializable, ThemeMenuHandler {
    @FXML
    private ListView<Event> eventListView;
    @FXML
    private TextArea eventDetailsArea;
    @FXML
    private ImageView eventImageView;
    @FXML
    private Button refreshButton;
    @FXML
    private Button allSourcesButton;
    @FXML
    private Button eventbriteButton;
    @FXML
    private Button alleventButton;
    @FXML
    private Button meetupButton;
    @FXML
    private ProgressBar progressBar;
    @FXML
    private Label statusLabel;
    @FXML
    private Label eventCountLabel;
    @FXML
    private TextField searchField;
    @FXML
    private DatePicker datePicker;
    @FXML
    private Button clearDateButton;

    private EventDataLoader dataLoader;
    private EventDetailsController detailsController;
    private FilterController filterController;
    private ScrapingController scrapingController;
    private ThemeMenuController themeMenuController;
    private DialogController dialogController;

    @Override
    public void initialize(URL url, ResourceBundle resourceBundle) {
        initializeControllers();
        filterController.initialize();
        dataLoader.loadAllEvents();
    }

    private void initializeControllers() {
        dataLoader = new EventDataLoader(eventListView, statusLabel, eventCountLabel, eventDetailsArea);
        detailsController = new EventDetailsController(
                eventListView,
                eventNameLabel,
                eventDateLabel,
                eventLocationLabel,
                openUrlButton,
                eventImageView
        );
        filterController = new FilterController(allSourcesButton, dataLoader);
        scrapingController = new ScrapingController(refreshButton, progressBar, statusLabel, dataLoader);
        themeMenuController = new ThemeMenuController(eventListView);
        dialogController = new DialogController(eventListView);
    }

    @Override
    public void setupThemeMenu(List<ThemePlugin> availableThemes) {
        themeMenuController.setupThemeMenu(availableThemes);
    }

    @FXML private Label eventNameLabel;
    @FXML private Label eventDateLabel;
    @FXML private Label eventLocationLabel;
    @FXML private Button openUrlButton;


    @FXML
    private void handleRefresh() {
        scrapingController.handleRefresh();
    }

    @FXML
    private void handleExit() {
        dialogController.handleExit();
    }

    @FXML
    private void handleAbout() {
        dialogController.showAboutDialog();
    }

    @FXML
    private void handleAllSources() {
        filterController.handleAllSources();
    }


    @FXML
    private void handleSearch() {
        filterController.handleSearch(searchField.getText());
    }

    @FXML
    private void handleDateFilter() {
        filterController.handleDateFilter(datePicker.getValue());
    }

    @FXML
    private void handleClearDateFilter() {
        datePicker.setValue(null);
        filterController.handleClearDateFilter();
    }

    @FXML
    private void handleOpenEvent() {
        Event selectedEvent = eventListView.getSelectionModel().getSelectedItem();
        if (selectedEvent == null) {
            dialogController.showErrorDialog("Aucun événement sélectionné",
                "Veuillez sélectionner un événement dans la liste pour l'ouvrir.");
            return;
        }

        String eventId = selectedEvent.getEventId();
        if (eventId == null || eventId.trim().isEmpty()) {
            dialogController.showErrorDialog("ID d'événement manquant",
                "L'événement sélectionné n'a pas d'identifiant valide.");
            return;
        }

        String url = "https://doorbudy.cloud/events/" + eventId;

        try {
            if (java.awt.Desktop.isDesktopSupported()) {
                java.awt.Desktop desktop = java.awt.Desktop.getDesktop();
                if (desktop.isSupported(java.awt.Desktop.Action.BROWSE)) {
                    desktop.browse(new java.net.URI(url));
                    statusLabel.setText("Ouverture de l'événement dans le navigateur...");
                } else {
                    dialogController.showErrorDialog("Navigation non supportée",
                        "Votre système ne supporte pas l'ouverture automatique du navigateur.\n" +
                        "Veuillez ouvrir manuellement l'URL: " + url);
                }
            } else {
                dialogController.showErrorDialog("Desktop non supporté",
                    "Votre système ne supporte pas l'ouverture automatique du navigateur.\n" +
                    "Veuillez ouvrir manuellement l'URL: " + url);
            }
        } catch (Exception e) {
            System.err.println("Erreur lors de l'ouverture de l'URL: " + e.getMessage());
            dialogController.showErrorDialog("Erreur d'ouverture",
                "Impossible d'ouvrir l'événement dans le navigateur.\n" +
                "URL: " + url + "\n" +
                "Erreur: " + e.getMessage());
        }
    }

}
