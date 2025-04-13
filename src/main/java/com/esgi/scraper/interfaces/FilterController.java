package com.esgi.scraper.interfaces;

import javafx.scene.control.Button;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

public class FilterController {
    private final Button allSourcesButton;
    private final Button eventbriteButton;
    private final Button alleventButton;
    private final Button meetupButton;
    private final EventDataLoader dataLoader;

    public FilterController(Button allSourcesButton, Button eventbriteButton, Button alleventButton, Button meetupButton, EventDataLoader dataLoader) {
        this.allSourcesButton = allSourcesButton;
        this.eventbriteButton = eventbriteButton;
        this.alleventButton = alleventButton;
        this.meetupButton = meetupButton;
        this.dataLoader = dataLoader;
    }

    public void initialize() {
        setActiveFilterButton(allSourcesButton);
    }

    public void handleAllSources() {
        setActiveFilterButton(allSourcesButton);
        dataLoader.loadAllEvents();
    }

    public void handleEventbriteFilter() {
        setActiveFilterButton(eventbriteButton);
        dataLoader.loadEventsBySource("eventbrite");
    }

    public void handleAlleventFilter() {
        setActiveFilterButton(alleventButton);
        dataLoader.loadEventsBySource("allevent");
    }

    public void handleMeetupFilter() {
        setActiveFilterButton(meetupButton);
        dataLoader.loadEventsBySource("meetup");
    }

    private void setActiveFilterButton(Button activeButton) {
        allSourcesButton.getStyleClass().remove("active-filter");
        eventbriteButton.getStyleClass().remove("active-filter");
        alleventButton.getStyleClass().remove("active-filter");
        meetupButton.getStyleClass().remove("active-filter");

        activeButton.getStyleClass().add("active-filter");
    }

    public void handleSearch(String searchText) {
        dataLoader.filterEventsByName(searchText);
    }

    public void handleDateFilter(LocalDate date) {
        if (date != null) {
            dataLoader.filterEventsByDate(date);
        }
    }

    public void handleClearDateFilter() {
        dataLoader.clearDateFilter();
    }
}
