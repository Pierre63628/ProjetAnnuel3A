package com.esgi.scraper.models;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class Event {
    private String date;
    private String detailedDate;
    private String detailedAddress;
    private String eventId;
    private String name;
    private String location;
    private String category;
    private String url;

    // ➕ Nouveaux champs
    private String description;
    private String photoUrl;
    private String source;
    private String quartierNom;
    private String organisateurNom;

    public Event() {
    }

    public Event(String date, String detailedDate, String detailedAddress, String eventId, String name, String location, String category, String url) {
        this.date = date;
        this.detailedDate = detailedDate;
        this.detailedAddress = detailedAddress;
        this.eventId = eventId;
        this.name = name;
        this.location = location;
        this.category = category;
        this.url = url;
    }

    // ✅ Getters & setters pour tous les champs

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getDetailedDate() {
        return detailedDate;
    }

    public void setDetailedDate(String detailedDate) {
        this.detailedDate = detailedDate;
    }

    public String getDetailedAddress() {
        return detailedAddress;
    }

    public void setDetailedAddress(String detailedAddress) {
        this.detailedAddress = detailedAddress;
    }

    public String getEventId() {
        return eventId;
    }

    public void setEventId(String eventId) {
        this.eventId = eventId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPhotoUrl() {
        return photoUrl;
    }

    public void setPhotoUrl(String photoUrl) {
        this.photoUrl = photoUrl;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getQuartierNom() {
        return quartierNom;
    }

    public void setQuartierNom(String quartierNom) {
        this.quartierNom = quartierNom;
    }

    public String getOrganisateurNom() {
        return organisateurNom;
    }

    public void setOrganisateurNom(String organisateurNom) {
        this.organisateurNom = organisateurNom;
    }

    @Override
    public String toString() {
        return name;
    }
}
