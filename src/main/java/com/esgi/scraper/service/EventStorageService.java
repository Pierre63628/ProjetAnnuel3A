package com.esgi.scraper.service;

import com.esgi.scraper.config.DatabaseConfig;
import com.esgi.scraper.utils.DateValidator;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

public class EventStorageService {
    private static final String STORAGE_DIR = "events_storage";
    static List<Map<String, String>> validEvents = new ArrayList<>();
    static List<Map<String, String>> invalidEvents = new ArrayList<>();
    private final ObjectMapper objectMapper;

    public EventStorageService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        createStorageDirectory();
    }

    public static void cleanEvents(List<Map<String, String>> events) {
        for (Map<String, String> event : events) {
            String dateStr = event.get("detailed_date");
            if (DateValidator.isValidEventDate(dateStr)) {
                event.put("date", DateValidator.convertToISO8601(dateStr));
                validEvents.add(event);
            } else {
                invalidEvents.add(event);
            }
        }
    }

    private void createStorageDirectory() {
        try {
            Files.createDirectories(Path.of("src/main/resources/" + STORAGE_DIR));
        } catch (IOException e) {
            System.err.println("Error creating storage directory: " + e.getMessage());
        }
    }

    public void saveEventsToJson(String source) {
        String fileName = String.format("src/main/resources/%s/%s_events.json", STORAGE_DIR, source);
        try {
            objectMapper.writeValue(new File(fileName), validEvents);
            System.out.println("Events saved to file: " + fileName);
        } catch (IOException e) {
            System.err.println("Error saving events to file: " + e.getMessage());
        }
    }

    public void saveEventsToDB(String source) {
        String sql = """
        INSERT INTO events (name, url, image_url, date, source)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT (url) DO NOTHING
    """;
        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            for (Map<String, String> event : validEvents) {
                pstmt.setString(1, event.get("name"));
                pstmt.setString(2, event.get("url"));
                pstmt.setString(3, event.get("image_url"));
                pstmt.setString(4, event.get("date"));
                pstmt.setString(5, source);
                pstmt.addBatch();
            }

            pstmt.executeBatch();
        } catch (SQLException e) {
            System.err.println("Error saving events: " + e.getMessage());
        }
    }



    public List<Map<String, String>> loadLatestEvents(String source) {
        try {
            Path storageDir = Paths.get(STORAGE_DIR);
            if (!Files.exists(storageDir)) {
                return new ArrayList<>();
            }

            File latestFile = Files.list(storageDir)
                    .filter(path -> path.getFileName().toString().startsWith(source + "_events_"))
                    .map(Path::toFile)
                    .max(Comparator.comparingLong(File::lastModified))
                    .orElse(null);

            if (latestFile != null) {
                return objectMapper.readValue(latestFile,
                        objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
            }
        } catch (IOException e) {
            System.err.println("Error loading events from file: " + e.getMessage());
        }
        return new ArrayList<>();
    }
}
