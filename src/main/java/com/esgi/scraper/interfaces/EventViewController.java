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
        detailsController = new EventDetailsController(eventListView, eventDetailsArea, eventImageView);
        filterController = new FilterController(allSourcesButton, eventbriteButton, alleventButton, meetupButton, dataLoader);
        scrapingController = new ScrapingController(refreshButton, progressBar, statusLabel, dataLoader);
        themeMenuController = new ThemeMenuController(eventListView);
        dialogController = new DialogController(eventListView);
    }

    @Override
    public void setupThemeMenu(List<ThemePlugin> availableThemes) {
        themeMenuController.setupThemeMenu(availableThemes);
    }

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
    private void handleEventbriteFilter() {
        filterController.handleEventbriteFilter();
    }

    @FXML
    private void handleAlleventFilter() {
        filterController.handleAlleventFilter();
    }

    @FXML
    private void handleMeetupFilter() {
        filterController.handleMeetupFilter();
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


}
