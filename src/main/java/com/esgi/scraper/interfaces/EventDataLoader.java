package com.esgi.scraper.interfaces;

import com.esgi.scraper.models.Event;
import com.esgi.scraper.repository.EventRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import javafx.scene.control.Label;
import javafx.scene.control.ListView;
import javafx.scene.control.TextArea;

import java.io.File;
import java.io.IOException;
import java.util.List;

public class EventDataLoader {
    private final ListView<Event> eventListView;
    private final Label statusLabel;
    private final Label eventCountLabel;
    private final TextArea eventDetailsArea;
    private final EventRepository eventRepository;

    public EventDataLoader(ListView<Event> eventListView, Label statusLabel, Label eventCountLabel, TextArea eventDetailsArea) {
        this.eventListView = eventListView;
        this.statusLabel = statusLabel;
        this.eventCountLabel = eventCountLabel;
        this.eventDetailsArea = eventDetailsArea;
        this.eventRepository = new EventRepository();
    }

    public void loadAllEvents() {
        eventListView.getItems().clear();

        try {
            List<Event> events = eventRepository.getAllEvents();

            if (!events.isEmpty()) {
                eventListView.getItems().addAll(events);
                updateEventCount();
                statusLabel.setText("Événements chargés depuis la base de données");
                return;
            }
        } catch (Exception e) {
            System.err.println("Erreur lors du chargement depuis la BDD: " + e.getMessage());
        }

        loadEventsFromJson("eventbrite");
    }

    public void loadEventsBySource(String source) {
        eventListView.getItems().clear();

        try {
            List<Event> events = eventRepository.getEventsBySource(source);

            if (!events.isEmpty()) {
                eventListView.getItems().addAll(events);
                updateEventCount();
                statusLabel.setText("Événements " + source + " chargés");
            } else {
                statusLabel.setText("Aucun événement trouvé pour " + source);
                loadEventsFromJson(source);
            }
        } catch (Exception e) {
            System.err.println("Erreur lors du chargement des événements depuis la BDD: " + e.getMessage());
            statusLabel.setText("Erreur de chargement");
            loadEventsFromJson(source);
        }
    }

    private void loadEventsFromJson(String source) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            List<Event> events = mapper.readValue(
                new File("src/main/resources/events_storage/" + source + "_events.json"),
                new TypeReference<>() {}
            );

            if (!events.isEmpty()) {
                eventListView.getItems().addAll(events);
                updateEventCount();
                statusLabel.setText("Événements " + source + " chargés depuis le fichier local");
            } else {
                statusLabel.setText("Aucun événement trouvé");
            }
        } catch (IOException e) {
            System.err.println("Erreur lors du chargement du fichier JSON: " + e.getMessage());
            eventDetailsArea.setText("Erreur lors du chargement des événements: " + e.getMessage());
            statusLabel.setText("Erreur de chargement");
        }
    }

    private void updateEventCount() {
        int count = eventListView.getItems().size();
        eventCountLabel.setText(count + " événements chargés");
    }
}
