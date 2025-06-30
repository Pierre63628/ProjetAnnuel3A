package com.esgi.scraper.interfaces;

import javafx.scene.control.Button;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

public class FilterController {
    private final Button allSourcesButton;
    private final EventDataLoader dataLoader;

    public FilterController(Button allSourcesButton, EventDataLoader dataLoader) {
        this.allSourcesButton = allSourcesButton;
        this.dataLoader = dataLoader;
    }

    public void initialize() {
        setActiveFilterButton(allSourcesButton);
    }

    public void handleAllSources() {
        setActiveFilterButton(allSourcesButton);
        dataLoader.loadAllEvents();
    }

    private void setActiveFilterButton(Button activeButton) {
        allSourcesButton.getStyleClass().remove("active-filter");

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
