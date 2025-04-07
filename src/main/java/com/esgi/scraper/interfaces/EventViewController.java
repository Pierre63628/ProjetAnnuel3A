package com.esgi.scraper.interfaces;

import com.esgi.scraper.models.Event;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import javafx.fxml.FXML;
import javafx.fxml.Initializable;
import javafx.scene.control.ListView;
import javafx.scene.control.TextArea;
import javafx.scene.image.ImageView;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.List;
import java.util.ResourceBundle;

public class EventViewController implements Initializable {
    @FXML
    private ListView<Event> eventListView;
    @FXML
    private TextArea eventDetailsArea;
    @FXML
    private ImageView eventImageView;

    @Override
    public void initialize(URL url, ResourceBundle resourceBundle) {
        loadEvents();
        setupEventSelection();
    }

    private void loadEvents() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            List<Event> events = mapper.readValue(
                new File("/Users/pes/PA 3eme Année/ProjetAnnuel3A/WebScrapperEventPA/events_storage/eventbrite_events_20250401_020822.json"),
                new TypeReference<List<Event>>() {}
            );
            eventListView.getItems().addAll(events);
        } catch (IOException e) {
            e.printStackTrace();
            eventDetailsArea.setText("Error loading events: " + e.getMessage());
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
        details.append("Name: ").append(event.getName()).append("\n");
        details.append("Date: ").append(event.getDate()).append("\n");
        details.append("URL: ").append(event.getUrl()).append("\n");
        eventDetailsArea.setText(details.toString());
    }
}
