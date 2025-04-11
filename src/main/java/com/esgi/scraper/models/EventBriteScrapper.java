package com.esgi.scraper.models;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.esgi.scraper.utils.Utils.isValid;

public class EventBriteScrapper {

    public List<Map<String, String>> scrape(String baseUrl, WebDriver driver, WebDriverWait wait) {
        List<Map<String, String>> allEvents = new ArrayList<>();

        for (int page = 1; page <= 10; page++) {
            String url = baseUrl + "?page=" + page;
            driver.get(url);
            System.out.println("Scraping page: " + page);
            try {
                wait.until(ExpectedConditions.presenceOfElementLocated(
                        By.cssSelector("div.event-card.event-card__horizontal")
                ));
            } catch (Exception e) {
                System.out.println("No event cards found on page " + page + ". Ending pagination.");
                break;
            }

            List<Map<String, String>> pageEvents = scrapeCurrentPage(driver);
            if (pageEvents.isEmpty()) {
                System.out.println("No events found on page " + page + ". Ending pagination.");
                break;
            }
            allEvents.addAll(pageEvents);
        }
        return allEvents;
    }

    private List<Map<String, String>> scrapeCurrentPage(WebDriver driver) {
        List<Map<String, String>> events = new ArrayList<>();
        List<WebElement> eventCards = driver.findElements(
                By.cssSelector("div.event-card.event-card__horizontal")
        );

        for (WebElement card : eventCards) {
            Map<String, String> eventDetails = new HashMap<>();
            try {
                // Extract basic details from the listing card
                WebElement linkElement = card.findElement(By.cssSelector("section.horizontal-event-card__column a.event-card-link"));
                String eventUrl = linkElement.getAttribute("href").trim();
                eventDetails.put("url", eventUrl);

                String eventId = linkElement.getAttribute("data-event-id");
                eventDetails.put("event_id", eventId != null ? eventId.trim() : "N/A");

                String category = linkElement.getAttribute("data-event-category");
                eventDetails.put("category", category != null ? category.trim() : "N/A");

                WebElement titleElement = card.findElement(By.cssSelector("section.event-card-details a.event-card-link h3"));
                String name = titleElement.getText().trim();
                eventDetails.put("name", name);

                List<WebElement> pElements = card.findElements(By.cssSelector("section.event-card-details p"));
                if (!pElements.isEmpty()) {
                    String dateTime = pElements.get(0).getText().trim();
                    eventDetails.put("date", dateTime);
                } else {
                    eventDetails.put("date", "N/A");
                }
                if (pElements.size() > 1) {
                    String location = pElements.get(1).getText().trim();
                    eventDetails.put("location", location);
                } else {
                    eventDetails.put("location", "N/A");
                }

                if (isValid(eventDetails.get("name"))) {
                    String originalWindow = driver.getWindowHandle();
                    ((JavascriptExecutor) driver).executeScript("window.open();");

                    // Switch to the new tab
                    for (String windowHandle : driver.getWindowHandles()) {
                        if (!windowHandle.equals(originalWindow)) {
                            driver.switchTo().window(windowHandle);
                            break;
                        }
                    }
                    driver.get(eventUrl);
                    WebDriverWait detailWait = new WebDriverWait(driver, Duration.ofSeconds(10));

                    try {
                        detailWait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("div.location-info")));
                        WebElement locationInfo = driver.findElement(By.cssSelector("div.location-info__address"));
                        String detailedAddress = locationInfo.getText().trim();
                        eventDetails.put("detailed_address", detailedAddress);
                    } catch (Exception e) {
                        eventDetails.put("detailed_address", "N/A");
                    }

                    try {
                        WebElement displayDateContainer = detailWait.until(ExpectedConditions.visibilityOfElementLocated(
                                By.cssSelector("div[data-testid='display-date-container']")
                        ));
                        WebElement dateSpan = displayDateContainer.findElement(By.cssSelector("span.date-info__full-datetime"));

                        List<WebElement> timeElements = dateSpan.findElements(By.tagName("time"));
                        if (!timeElements.isEmpty()) {
                            String detailedDateTime = timeElements.get(0).getAttribute("datetime");
                            eventDetails.put("detailed_date", detailedDateTime);
                        } else {
                            eventDetails.put("detailed_date", dateSpan.getText().trim());
                        }
                    } catch (Exception e) {
                        eventDetails.put("detailed_date", "N/A");
                    }

                    driver.close();
                    driver.switchTo().window(originalWindow);

                    events.add(eventDetails);
                }
            } catch (Exception e) {
                System.err.println("Error extracting event: " + e.getMessage());
            }
        }
        return events;
    }
}
