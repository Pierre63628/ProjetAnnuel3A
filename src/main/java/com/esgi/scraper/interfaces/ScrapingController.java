package com.esgi.scraper.interfaces;

import com.esgi.scraper.service.ScraperService;
import javafx.application.Platform;
import javafx.concurrent.Task;
import javafx.scene.control.Alert;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.scene.control.ProgressBar;
import javafx.scene.control.Spinner;

public class ScrapingController {
    private final Button refreshButton;
    private final ProgressBar progressBar;
    private final Label statusLabel;
    private final EventDataLoader dataLoader;
    private final Spinner<Integer> pagesSpinner;
    private Task<Void> scrapingTask;

    public ScrapingController(Button refreshButton, ProgressBar progressBar, Label statusLabel, EventDataLoader dataLoader, Spinner<Integer> pagesSpinner) {
        this.refreshButton = refreshButton;
        this.progressBar = progressBar;
        this.statusLabel = statusLabel;
        this.dataLoader = dataLoader;
        this.pagesSpinner = pagesSpinner;
    }

    public void handleRefresh() {
        if (scrapingTask != null && scrapingTask.isRunning()) {
            return;
        }

        progressBar.setVisible(true);
        progressBar.setProgress(ProgressBar.INDETERMINATE_PROGRESS);
        statusLabel.setText("Scraping en cours de " + pagesSpinner.getValue().toString() + " pages...");
        refreshButton.setDisable(true);

        scrapingTask = new Task<Void>() {
            @Override
            protected Void call() {
                ScraperService scraperService = new ScraperService();
                int maxPages = pagesSpinner.getValue();
                int eventCount = scraperService.runScraping("https://www.eventbrite.fr/d/france/all-events/", maxPages);
                System.out.println("Scraping completed with " + eventCount + " events from " + maxPages + " pages.");
                return null;
            }

            @Override
            protected void succeeded() {
                Platform.runLater(() -> {
                    dataLoader.loadAllEvents();
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
}
