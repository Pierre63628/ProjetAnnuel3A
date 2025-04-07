package com.esgi.scraper.interfaces;

import com.esgi.scraper.service.ScraperService;
import javafx.application.Application;
import javafx.concurrent.Task;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.stage.Stage;

import java.io.IOException;

public class EventViewerApplication extends Application {
    @Override
    public void start(Stage stage) throws IOException {
        FXMLLoader fxmlLoader = new FXMLLoader(EventViewerApplication.class.getResource("/eventViewer.fxml"));
        Scene scene = new Scene(fxmlLoader.load(), 800, 600);
        stage.setTitle("Event Viewer");
        stage.setScene(scene);
        stage.show();

        // Launch scraping in background after UI is shown
        scrape();
    }

    public static void main(String[] args) {
        launch();
    }

    public void scrape() {
        Task<Void> scrapingTask = new Task<>() {
            @Override
            protected Void call() {
                ScraperService scraperService = new ScraperService();
                scraperService.runScraping("https://www.eventbrite.fr/d/france/all-events/");
                return null;
            }
        };

        new Thread(scrapingTask).start();
    }
}
