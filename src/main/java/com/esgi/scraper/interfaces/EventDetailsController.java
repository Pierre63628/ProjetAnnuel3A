package com.esgi.scraper.interfaces;

import com.esgi.scraper.models.Event;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ListView;
import javafx.scene.control.TextArea;
import javafx.scene.image.Image;
import javafx.scene.image.ImageView;

public class EventDetailsController {

    private final ListView<Event> eventListView;
    private final Label eventNameLabel;
    private final Label eventDateLabel;
    private final Label eventLocationLabel;
    private final Button openUrlButton;
    private final ImageView eventImageView;

    public EventDetailsController(
            ListView<Event> eventListView,
            Label eventNameLabel,
            Label eventDateLabel,
            Label eventLocationLabel,
            Button openUrlButton,
            ImageView eventImageView
    ) {
        this.eventListView = eventListView;
        this.eventNameLabel = eventNameLabel;
        this.eventDateLabel = eventDateLabel;
        this.eventLocationLabel = eventLocationLabel;
        this.openUrlButton = openUrlButton;
        this.eventImageView = eventImageView;

        setupEventSelection();
    }

    private void setupEventSelection() {
        // Initially disable the button
        openUrlButton.setDisable(true);

        eventListView.getSelectionModel().selectedItemProperty().addListener((obs, oldVal, newVal) -> {
            if (newVal != null) {
                displayEventDetails(newVal);
                // Enable button when an event is selected
                openUrlButton.setDisable(false);
            } else {
                // Disable button when no event is selected
                openUrlButton.setDisable(true);
                clearEventDetails();
            }
        });
    }

    private void displayEventDetails(Event event) {
        eventNameLabel.setText(event.getName() != null ? event.getName() : "Non défini");
        eventDateLabel.setText(event.getDate() != null ? event.getDate().toString() : "Non défini");
        eventLocationLabel.setText(event.getDetailedAddress() != null ? event.getDetailedAddress() : "Inconnu");

        // Load event image if available
        if (event.getPhotoUrl() != null && !event.getPhotoUrl().trim().isEmpty()) {
            try {
                Image image = new Image(event.getPhotoUrl(), true);
                eventImageView.setImage(image);
            } catch (Exception e) {
                // If image loading fails, clear the image view
                eventImageView.setImage(null);
            }
        } else {
            eventImageView.setImage(null);
        }
    }

    private void clearEventDetails() {
        eventNameLabel.setText("");
        eventDateLabel.setText("");
        eventLocationLabel.setText("");
        eventImageView.setImage(null);
    }
}
