package com.esgi.scraper.interfaces;

import com.esgi.scraper.models.Event;
import javafx.scene.control.ListView;
import javafx.scene.control.TextArea;
import javafx.scene.image.ImageView;

public class EventDetailsController {
    private final ListView<Event> eventListView;
    private final TextArea eventDetailsArea;
    private final ImageView eventImageView;

    public EventDetailsController(ListView<Event> eventListView, TextArea eventDetailsArea, ImageView eventImageView) {
        this.eventListView = eventListView;
        this.eventDetailsArea = eventDetailsArea;
        this.eventImageView = eventImageView;
        setupEventSelection();
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
}
