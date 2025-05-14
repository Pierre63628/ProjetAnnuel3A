package com.esgi.scraper.service;

import com.esgi.scraper.models.AllEventScraper;
import com.esgi.scraper.models.EventBriteScrapper;
import com.esgi.scraper.models.MeetupEventScraper;
import com.esgi.scraper.repository.EventRepository;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;
import java.util.Map;

import static com.esgi.scraper.utils.Utils.toJson;

public class ScraperService {
    private final EventBriteScrapper eventBriteScrapper;
    private final AllEventScraper allEventScraper;
    private final MeetupEventScraper meetupEventScraper;
    private final EventRepository eventRepository;
    private final EventStorageService eventStorageService;


    public ScraperService() {
        this.eventBriteScrapper = new EventBriteScrapper();
        this.allEventScraper = new AllEventScraper();
        this.meetupEventScraper = new MeetupEventScraper();
        this.eventRepository = new EventRepository();
        this.eventStorageService = new EventStorageService();
        this.eventRepository.createTableIfNotExists();
    }

    public int runScraping(String url) {
        WebDriverManager.chromedriver().setup();
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new");
        options.addArguments("--window-size=1920,1080");
        WebDriver driver = new ChromeDriver(options);
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(15));

        try {
            List<Map<String, String>> events = null;
            String source = null;

            if (url.contains("eventbrite")) {
                events = eventBriteScrapper.scrape(url, driver, wait);
                source = "eventbrite";
            } else if (url.contains("allevent")) {
                events = allEventScraper.scrape(url, driver, wait);
                source = "allevent";
            } else if (url.contains("meetup")) {
                events = meetupEventScraper.scrape(url, driver, wait);
                source = "meetup";
            }

            eventRepository.cleanupOldEvents(30);

            if (events != null && !events.isEmpty()) {
                System.out.println("Scraped " + events.size() + " events.");

                eventStorageService.cleanEvents(events);
                int validCount = eventStorageService.validEvents.size();
                int invalidCount = eventStorageService.invalidEvents.size();
                System.out.println("Valid events: " + validCount + ", Invalid events: " + invalidCount);

                eventStorageService.saveEventsToDB(source);
                eventStorageService.saveEventsToJson(source);

                return validCount;
            } else {
                List<Map<String, String>> cachedEvents = eventStorageService.loadLatestEvents(source);
                if (!cachedEvents.isEmpty()) {
                    System.out.println("Loaded " + cachedEvents.size() + " cached events from file.");
                    return cachedEvents.size();
                } else {
                    System.out.println("No events found (neither online nor cached).");
                    return 0;
                }
            }
        } finally {
            try {
                driver.quit();
            } catch (Exception e) {
                System.err.println("Error closing WebDriver: " + e.getMessage());
            }
        }
    }

}
