package com.esgi.scraper.utils;

import com.esgi.scraper.models.Event;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.*;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Utility class to handle resource loading in both development and packaged environments
 */
public class ResourceManager {
    private static final String EVENTS_STORAGE_PATH = "/events_storage/";
    private static final String EXTERNAL_STORAGE_DIR = "events_storage";
    private final ObjectMapper objectMapper;

    public ResourceManager() {
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Load events from JSON file, trying classpath resources first, then external files
     */
    public List<Map<String, String>> loadEventsFromJson(String source) {
        String fileName = source + "_events.json";

        // First try to load from classpath resources (packaged JSON files)
        List<Map<String, String>> events = loadFromClasspath(fileName);
        if (!events.isEmpty()) {
            System.out.println("Loaded " + events.size() + " events from classpath resource: " + fileName);
            return events;
        }

        // Then try to load from external storage directory
        events = loadFromExternalStorage(fileName);
        if (!events.isEmpty()) {
            System.out.println("Loaded " + events.size() + " events from external storage: " + fileName);
            return events;
        }

        System.out.println("No events found for source: " + source);
        return new ArrayList<>();
    }

    /**
     * Load Event objects from JSON file, trying classpath resources first, then external files
     */
    public List<Event> loadEventObjectsFromJson(String source) {
        String fileName = source + "_events.json";

        // First try to load from classpath resources (packaged JSON files)
        List<Event> events = loadEventObjectsFromClasspath(fileName);
        if (!events.isEmpty()) {
            System.out.println("Loaded " + events.size() + " Event objects from classpath resource: " + fileName);
            return events;
        }

        // Then try to load from external storage directory
        events = loadEventObjectsFromExternalStorage(fileName);
        if (!events.isEmpty()) {
            System.out.println("Loaded " + events.size() + " Event objects from external storage: " + fileName);
            return events;
        }

        System.out.println("No Event objects found for source: " + source);
        return new ArrayList<>();
    }

    /**
     * Load events from classpath resources (works in both development and packaged JAR)
     */
    private List<Map<String, String>> loadFromClasspath(String fileName) {
        String resourcePath = EVENTS_STORAGE_PATH + fileName;
        
        try (InputStream inputStream = getClass().getResourceAsStream(resourcePath)) {
            if (inputStream != null) {
                return objectMapper.readValue(inputStream, 
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
            }
        } catch (IOException e) {
            System.err.println("Error loading from classpath resource " + resourcePath + ": " + e.getMessage());
        }
        
        return new ArrayList<>();
    }

    /**
     * Load events from external storage directory (for user-generated files)
     */
    private List<Map<String, String>> loadFromExternalStorage(String fileName) {
        try {
            Path externalDir = Paths.get(EXTERNAL_STORAGE_DIR);
            if (!Files.exists(externalDir)) {
                return new ArrayList<>();
            }

            Path filePath = externalDir.resolve(fileName);
            if (Files.exists(filePath)) {
                return objectMapper.readValue(filePath.toFile(),
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
            }
        } catch (IOException e) {
            System.err.println("Error loading from external storage " + fileName + ": " + e.getMessage());
        }

        return new ArrayList<>();
    }

    /**
     * Load Event objects from classpath resources (works in both development and packaged JAR)
     */
    private List<Event> loadEventObjectsFromClasspath(String fileName) {
        String resourcePath = EVENTS_STORAGE_PATH + fileName;

        try (InputStream inputStream = getClass().getResourceAsStream(resourcePath)) {
            if (inputStream != null) {
                return objectMapper.readValue(inputStream, new TypeReference<List<Event>>() {});
            }
        } catch (IOException e) {
            System.err.println("Error loading Event objects from classpath resource " + resourcePath + ": " + e.getMessage());
        }

        return new ArrayList<>();
    }

    /**
     * Load Event objects from external storage directory (for user-generated files)
     */
    private List<Event> loadEventObjectsFromExternalStorage(String fileName) {
        try {
            Path externalDir = Paths.get(EXTERNAL_STORAGE_DIR);
            if (!Files.exists(externalDir)) {
                return new ArrayList<>();
            }

            Path filePath = externalDir.resolve(fileName);
            if (Files.exists(filePath)) {
                return objectMapper.readValue(filePath.toFile(), new TypeReference<List<Event>>() {});
            }
        } catch (IOException e) {
            System.err.println("Error loading Event objects from external storage " + fileName + ": " + e.getMessage());
        }

        return new ArrayList<>();
    }

    /**
     * Save events to external storage directory
     */
    public boolean saveEventsToExternalStorage(String source, List<Map<String, String>> events) {
        try {
            Path externalDir = Paths.get(EXTERNAL_STORAGE_DIR);
            Files.createDirectories(externalDir);
            
            String fileName = source + "_events.json";
            Path filePath = externalDir.resolve(fileName);
            
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(filePath.toFile(), events);
            System.out.println("Events saved to external storage: " + filePath.toAbsolutePath());
            return true;
        } catch (IOException e) {
            System.err.println("Error saving events to external storage: " + e.getMessage());
            return false;
        }
    }

    /**
     * Check if a resource exists in the classpath
     */
    public boolean resourceExists(String resourcePath) {
        URL resource = getClass().getResource(resourcePath);
        return resource != null;
    }

    /**
     * Get the absolute path of external storage directory
     */
    public String getExternalStorageDir() {
        return Paths.get(EXTERNAL_STORAGE_DIR).toAbsolutePath().toString();
    }
}
