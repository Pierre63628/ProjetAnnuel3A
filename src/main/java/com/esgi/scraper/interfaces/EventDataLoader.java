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
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class EventDataLoader {
    private final ListView<Event> eventListView;
    private final Label statusLabel;
    private final Label eventCountLabel;
    private final TextArea eventDetailsArea;
    private final EventRepository eventRepository;

    private List<Event> allEvents = new ArrayList<>();
    private String currentSource = null;
    private String currentSearchText = null;
    private LocalDate currentDate = null;

    public EventDataLoader(ListView<Event> eventListView, Label statusLabel, Label eventCountLabel, TextArea eventDetailsArea) {
        this.eventListView = eventListView;
        this.statusLabel = statusLabel;
        this.eventCountLabel = eventCountLabel;
        this.eventDetailsArea = eventDetailsArea;
        this.eventRepository = new EventRepository();
    }

    public void loadAllEvents() {
        currentSource = null;
        currentSearchText = null;
        currentDate = null;
        eventListView.getItems().clear();
        allEvents.clear();

        try {
            List<Event> events = eventRepository.getAllEvents();

            if (!events.isEmpty()) {
                allEvents.addAll(events);
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
        currentSource = source;
        currentSearchText = null;
        currentDate = null;
        eventListView.getItems().clear();
        allEvents.clear();

        try {
            List<Event> events = eventRepository.getEventsBySource(source);

            if (!events.isEmpty()) {
                allEvents.addAll(events);
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
                allEvents.addAll(events);
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

    public void filterEventsByName(String searchText) {
        currentSearchText = searchText;
        applyFilters();
    }

    public void filterEventsByDate(LocalDate date) {
        currentDate = date;
        applyFilters();
    }

    public void clearDateFilter() {
        currentDate = null;
        applyFilters();
    }

    private void applyFilters() {
        List<Event> filteredEvents = new ArrayList<>(allEvents);

        if (currentSearchText != null && !currentSearchText.isEmpty()) {
            String searchLower = currentSearchText.toLowerCase();
            filteredEvents = filteredEvents.stream()
                .filter(event -> event.getName().toLowerCase().contains(searchLower))
                .collect(Collectors.toList());
        }

        if (currentDate != null) {
            DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE;
            filteredEvents = filteredEvents.stream()
                .filter(event -> {
                    try {
                        String eventDateStr = event.getDate();
                        if (eventDateStr != null && !eventDateStr.isEmpty()) {
                            LocalDate eventDate = LocalDate.parse(eventDateStr.substring(0, 10), formatter);
                            return eventDate.equals(currentDate);
                        }
                        return false;
                    } catch (DateTimeParseException e) {
                        return false;
                    }
                })
                .collect(Collectors.toList());
        }

        eventListView.getItems().clear();
        eventListView.getItems().addAll(filteredEvents);
        updateEventCount();

        if (filteredEvents.isEmpty()) {
            statusLabel.setText("Aucun événement ne correspond aux filtres");
        } else {
            statusLabel.setText(filteredEvents.size() + " événements correspondent aux filtres");
        }
    }

    private void updateEventCount() {
        int count = eventListView.getItems().size();
        eventCountLabel.setText(count + " événements chargés");
    }
}
