package com.esgi.scraper;


import com.esgi.scraper.service.ScraperService;

public class ScrapeEvent {



    String url = "https://www.eventbrite.fr/d/france/all-events/";

    public ScrapeEvent(ScraperService scraperService, String url) {
        this.scraperService = scraperService;
        this.url = url;
    }

    ScraperService scraperService = new ScraperService();
    //scraperService.runScraping(url);

}






//String url = "https://allevents.in/paris/all?ref=new-cityhome-popular#";
//String url = "https://www.meetup.com/fr/find/?source=EVENTS&eventType=inPerson&sortField=DATETIME&location=fr--Paris";