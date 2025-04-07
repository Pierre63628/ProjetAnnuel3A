package com.esgi.scraper.models;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.esgi.scraper.utils.Utils.isValid;

public class MeetupEventScraper {

    public List<Map<String, String>> scrape(String url, WebDriver driver, WebDriverWait wait) {
        driver.get(url);

        wait.until(ExpectedConditions.presenceOfElementLocated(
                By.cssSelector("div[data-eventref]")
        ));

        List<WebElement> eventContainers = driver.findElements(By.cssSelector("div[data-eventref]"));
        List<Map<String, String>> events = new ArrayList<>();

        for (WebElement container : eventContainers) {
            Map<String, String> eventDetails = new HashMap<>();

            try {
                WebElement linkElement = container.findElement(By.cssSelector("a"));
                String eventUrl = linkElement.getAttribute("href");
                eventDetails.put("url", eventUrl != null ? eventUrl.trim() : "N/A");

                WebElement imgElement = container.findElement(By.cssSelector("img"));
                String imageUrl = imgElement.getAttribute("src");
                eventDetails.put("image_url", imageUrl != null ? imageUrl.trim() : "N/A");


                WebElement timeElement = container.findElement(By.cssSelector("h3 time"));
                String date = timeElement.getText().trim();
                eventDetails.put("date", date);

                WebElement titleElement = container.findElement(By.cssSelector("h2"));
                String title = titleElement.getText().trim();
                eventDetails.put("name", title);

                if (isValid(eventDetails.get("name"))) {
                    events.add(eventDetails);
                }

            } catch (Exception e) {
                System.err.println("Error extracting event: " + e.getMessage());
            }
        }
        return events;
    }
}
