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

public class AllEventScraper {


    public List<Map<String, String>> scrape(String url, WebDriver driver, WebDriverWait wait) {
        driver.get(url);

        wait.until(ExpectedConditions.presenceOfElementLocated(By.cssSelector("div.meta")));

        // Locate all event containers
        List<WebElement> eventContainers = driver.findElements(By.cssSelector("div.meta"));
        List<Map<String, String>> events = new ArrayList<>();

        for (WebElement container : eventContainers) {
            Map<String, String> eventDetails = new HashMap<>();
            try {
                String name = container.findElement(By.cssSelector("div.title a h3")).getText().trim();
                eventDetails.put("name", name);

                String eventUrl = container.findElement(By.cssSelector("div.title a")).getAttribute("href").trim();
                eventDetails.put("url", eventUrl);

                String location = container.findElement(By.cssSelector("div.subtitle")).getText().trim();
                eventDetails.put("location", location);

                String date = container.findElement(By.cssSelector("div.meta-bottom div.date")).getText().trim();
                eventDetails.put("date", date);

                String price = container.findElement(By.cssSelector("div.meta-bottom div.price-container")).getText().trim();
                eventDetails.put("price", price.isEmpty() ? "N/A" : price);


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
