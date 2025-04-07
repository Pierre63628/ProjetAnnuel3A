package com.esgi.scraper;

import com.esgi.scraper.service.ScraperService;

public class Main {
    public static void main(String[] args) {
        String url = "https://www.eventbrite.fr/d/france/all-events/";
        //String url = "https://allevents.in/paris/all?ref=new-cityhome-popular#";
        //String url = "https://www.meetup.com/fr/find/?source=EVENTS&eventType=inPerson&sortField=DATETIME&location=fr--Paris";

        ScraperService scraperService = new ScraperService();
        scraperService.runScraping(url);
    }
}
