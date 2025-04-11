package com.esgi.scraper.interfaces;

import com.esgi.scraper.models.Event;
import com.esgi.scraper.repository.EventRepository;
import com.esgi.scraper.service.ScraperService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import javafx.application.Platform;
import javafx.concurrent.Task;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.*;
import javafx.scene.image.ImageView;
import javafx.stage.Stage;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.ResourceBundle;

public class EventViewController implements Initializable {
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

    private Task<Void> scrapingTask;
    private final EventRepository eventRepository = new EventRepository();

    @Override
    public void initialize(URL url, ResourceBundle resourceBundle) {
        // Initialiser l'interface
        setupEventSelection();

        // Définir le bouton "Tous" comme actif par défaut
        setActiveFilterButton(allSourcesButton);

        // Charger tous les événements
        loadEvents();
    }

    /**
     * Charge les événements depuis la base de données ou depuis un fichier JSON si la connexion à la BDD échoue
     */
    private void loadEvents() {
        eventListView.getItems().clear();

        try {
            // Essayer de charger depuis la base de données d'abord
            List<Event> events = eventRepository.getAllEvents();

            if (!events.isEmpty()) {
                // Si des événements ont été trouvés dans la BDD, les afficher
                eventListView.getItems().addAll(events);
                updateEventCount();
                statusLabel.setText("Événements chargés depuis la base de données");
                return;
            }
        } catch (Exception e) {
            System.err.println("Erreur lors du chargement depuis la BDD: " + e.getMessage());
            // Continuer pour essayer de charger depuis le fichier JSON
        }

        // Si on arrive ici, c'est que la BDD n'a pas fonctionné ou est vide
        // Essayer de charger depuis le fichier JSON
        try {
            ObjectMapper mapper = new ObjectMapper();
            List<Event> events = mapper.readValue(
                new File("src/main/resources/events_storage/eventbrite_events.json"),
                new TypeReference<>() {}
            );

            if (!events.isEmpty()) {
                eventListView.getItems().addAll(events);
                updateEventCount();
                statusLabel.setText("Événements chargés depuis le fichier local");
            } else {
                statusLabel.setText("Aucun événement trouvé");
            }
        } catch (IOException e) {
            e.printStackTrace();
            eventDetailsArea.setText("Erreur lors du chargement des événements: " + e.getMessage());
            statusLabel.setText("Erreur de chargement");
        }
    }

    private void setupEventSelection() {
        eventListView.getSelectionModel().selectedItemProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null) {
                displayEventDetails(newVal);
            }
        });
    }

    private void displayEventDetails(Event event) {
        StringBuilder details = new StringBuilder();
        details.append("Nom: ").append(event.getName()).append("\n\n");
        details.append("Date: ").append(event.getDate()).append("\n\n");

        if (event.getDetailedDate() != null && !event.getDetailedDate().isEmpty()) {
            details.append("Date détaillée: ").append(event.getDetailedDate()).append("\n\n");
        }

        if (event.getDetailedAddress() != null && !event.getDetailedAddress().isEmpty()) {
            details.append("Adresse: ").append(event.getDetailedAddress()).append("\n\n");
        }

        if (event.getCategory() != null && !event.getCategory().isEmpty() && !event.getCategory().equals("N/A")) {
            details.append("Catégorie: ").append(event.getCategory()).append("\n\n");
        }

        details.append("URL: ").append(event.getUrl()).append("\n");
        eventDetailsArea.setText(details.toString());
    }

    private void updateEventCount() {
        int count = eventListView.getItems().size();
        eventCountLabel.setText(count + " événements chargés");
    }

    /**
     * Charge les événements d'une source spécifique depuis la base de données
     * @param source La source des événements (eventbrite, allevent, meetup)
     */
    private void loadEventsBySource(String source) {
        eventListView.getItems().clear();

        try {
            // Charger les événements de la source spécifiée
            List<Event> events = eventRepository.getEventsBySource(source);

            if (!events.isEmpty()) {
                eventListView.getItems().addAll(events);
                updateEventCount();
                statusLabel.setText("Événements " + source + " chargés");
            } else {
                statusLabel.setText("Aucun événement trouvé pour " + source);

                // Essayer de charger depuis le fichier JSON si la BDD est vide pour cette source
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    List<Event> jsonEvents = mapper.readValue(
                        new File("src/main/resources/events_storage/" + source + "_events.json"),
                        new TypeReference<>() {}
                    );

                    if (!jsonEvents.isEmpty()) {
                        eventListView.getItems().addAll(jsonEvents);
                        updateEventCount();
                        statusLabel.setText("Événements " + source + " chargés depuis le fichier local");
                    }
                } catch (IOException e) {
                    System.err.println("Erreur lors du chargement du fichier JSON pour " + source + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            System.err.println("Erreur lors du chargement des événements depuis la BDD: " + e.getMessage());
            statusLabel.setText("Erreur de chargement");
        }
    }

    @FXML
    private void handleRefresh() {
        if (scrapingTask != null && scrapingTask.isRunning()) {
            return; // Éviter les lancements multiples
        }

        progressBar.setVisible(true);
        progressBar.setProgress(ProgressBar.INDETERMINATE_PROGRESS);
        statusLabel.setText("Scraping en cours...");
        refreshButton.setDisable(true);

        scrapingTask = new Task<Void>() {
            @Override
            protected Void call() {
                ScraperService scraperService = new ScraperService();
                int eventCount = scraperService.runScraping("https://www.eventbrite.fr/d/france/all-events/");
                System.out.println("Scraping completed with " + eventCount + " events.");
                return null;
            }

            @Override
            protected void succeeded() {
                Platform.runLater(() -> {
                    loadEvents();
                    progressBar.setVisible(false);
                    statusLabel.setText("Scraping terminé");
                    refreshButton.setDisable(false);
                });
            }

            @Override
            protected void failed() {
                Platform.runLater(() -> {
                    progressBar.setVisible(false);
                    statusLabel.setText("Erreur lors du scraping");
                    refreshButton.setDisable(false);
                    Alert alert = new Alert(Alert.AlertType.ERROR);
                    alert.setTitle("Erreur");
                    alert.setHeaderText("Erreur lors du scraping");
                    alert.setContentText("Une erreur s'est produite lors du scraping des événements.");
                    alert.showAndWait();
                });
            }
        };

        new Thread(scrapingTask).start();
    }

    @FXML
    private void handleExit() {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Quitter");
        alert.setHeaderText("Quitter l'application");
        alert.setContentText("Êtes-vous sûr de vouloir quitter l'application ?");

        Optional<ButtonType> result = alert.showAndWait();
        if (result.isPresent() && result.get() == ButtonType.OK) {
            Stage stage = (Stage) eventListView.getScene().getWindow();
            stage.close();
        }
    }

    @FXML
    private void handleAbout() {
        Alert alert = new Alert(Alert.AlertType.INFORMATION);
        alert.setTitle("À propos");
        alert.setHeaderText("Event Viewer");
        alert.setContentText("Application de visualisation d'événements scrapés depuis différents sites.\n\nDéveloppé par des éléves de l'esgi.");
        alert.showAndWait();
    }

    /**
     * Gestionnaire pour le bouton "Tous" - Affiche tous les événements
     */
    @FXML
    private void handleAllSources() {
        setActiveFilterButton(allSourcesButton);
        loadEvents();
    }

    /**
     * Gestionnaire pour le bouton "Eventbrite" - Filtre les événements d'Eventbrite
     */
    @FXML
    private void handleEventbriteFilter() {
        setActiveFilterButton(eventbriteButton);
        loadEventsBySource("eventbrite");
    }

    /**
     * Gestionnaire pour le bouton "AllEvent" - Filtre les événements d'AllEvent
     */
    @FXML
    private void handleAlleventFilter() {
        setActiveFilterButton(alleventButton);
        loadEventsBySource("allevent");
    }

    /**
     * Gestionnaire pour le bouton "Meetup" - Filtre les événements de Meetup
     */
    @FXML
    private void handleMeetupFilter() {
        setActiveFilterButton(meetupButton);
        loadEventsBySource("meetup");
    }

    /**
     * Définit le bouton de filtre actif en lui appliquant un style différent
     * @param activeButton Le bouton à marquer comme actif
     */
    private void setActiveFilterButton(Button activeButton) {
        // Réinitialiser tous les boutons
        allSourcesButton.getStyleClass().remove("active-filter");
        eventbriteButton.getStyleClass().remove("active-filter");
        alleventButton.getStyleClass().remove("active-filter");
        meetupButton.getStyleClass().remove("active-filter");

        // Marquer le bouton actif
        activeButton.getStyleClass().add("active-filter");
    }
}
