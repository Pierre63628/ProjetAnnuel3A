package com.esgi.scraper.service;

import com.esgi.scraper.config.DatabaseConfig;
import com.esgi.scraper.utils.AddressUtils;
import com.esgi.scraper.utils.DateValidator;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

public class EventStorageService {
    private static final String STORAGE_DIR = "events_storage";
    public List<Map<String, String>> validEvents = new ArrayList<>();
    public List<Map<String, String>> invalidEvents = new ArrayList<>();
    private final ObjectMapper objectMapper;

    public EventStorageService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        createStorageDirectory();
    }

    public void cleanEvents(List<Map<String, String>> events) {
        validEvents.clear();
        invalidEvents.clear();

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
            Files.createDirectories(Path.of("/" + STORAGE_DIR));
        } catch (IOException e) {
            System.err.println("Error creating storage directory: " + e.getMessage());
        }
    }

    public void saveEventsToJson(String source) {
        String fileName = String.format("/%s/%s_events.json", STORAGE_DIR, source);
        try {
            objectMapper.writeValue(new File(fileName), validEvents);
            System.out.println("Events saved to file: " + fileName);
        } catch (IOException e) {
            System.err.println("Error saving events to file: " + e.getMessage());
        }
    }

    public void saveEventsToDB(String source) {
        String sql = """
        INSERT INTO "Evenement" (nom, url, photo_url, date_evenement, source, detailed_address, quartier_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (url) DO UPDATE SET
            nom = EXCLUDED.nom,
            photo_url = EXCLUDED.photo_url,
            date_evenement = EXCLUDED.date_evenement,
            source = EXCLUDED.source,
            detailed_address = EXCLUDED.detailed_address,
            quartier_id = EXCLUDED.quartier_id,
            updated_at = CURRENT_TIMESTAMP
    """;

        try (Connection conn = DatabaseConfig.getConnection();
             PreparedStatement pstmt = conn.prepareStatement(sql)) {

            int insertedCount = 0;
            int updatedCount = 0;
            int skippedCount = 0;

            for (Map<String, String> event : validEvents) {
                String rawAddress = event.get("detailed_address");
                String cleanedAddress = AddressUtils.cleanAddress(rawAddress);

                Optional<double[]> coordsOpt = getCoordinatesFromAddress(cleanedAddress);
                if (coordsOpt.isEmpty()) {
                    skippedCount++;
                    continue;
                }

                double[] coords = coordsOpt.get();
                Optional<Integer> quartierIdOpt = getQuartierIdFromCoordinates(coords[0], coords[1]);
                if (quartierIdOpt.isEmpty()) {
                    skippedCount++;
                    continue;
                }

                pstmt.setString(1, event.get("name"));
                pstmt.setString(2, event.get("url"));
                pstmt.setString(3, event.get("image_url"));
                String dateStr = event.get("date");
                Timestamp timestamp = Timestamp.valueOf(dateStr.replace("T", " "));
                pstmt.setTimestamp(4, timestamp);
                pstmt.setString(5, source);
                pstmt.setString(6, cleanedAddress);
                pstmt.setInt(7, quartierIdOpt.get());

                pstmt.addBatch();
            }

            int[] results = pstmt.executeBatch();

            for (int result : results) {
                if (result == Statement.SUCCESS_NO_INFO || result > 0) {
                    insertedCount++;
                } else {
                    updatedCount++;
                }
            }
            System.out.println("Events saved to database: " + insertedCount + " inserted/updated, " + skippedCount + " skipped.");
        } catch (SQLException e) {
            System.err.println("Error saving events: " + e.getMessage());
        }
    }


    public Optional<double[]> getCoordinatesFromAddress(String address) {
        try {
            String encodedAddress = URLEncoder.encode(address, StandardCharsets.UTF_8);
            String url = "https://api-adresse.data.gouv.fr/search/?q=" + encodedAddress;

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            JSONObject json = new JSONObject(response.body());
            JSONArray features = json.getJSONArray("features");

            if (features.length() > 0) {
                JSONArray coordinates = features.getJSONObject(0)
                        .getJSONObject("geometry")
                        .getJSONArray("coordinates");

                double longitude = coordinates.getDouble(0);
                double latitude = coordinates.getDouble(1);

                return Optional.of(new double[]{longitude, latitude});
            }
        } catch (Exception e) {
            System.err.println("Error getting coordinates: " + e.getMessage());
        }
        return Optional.empty();
    }

    public static Optional<Integer> getQuartierIdFromCoordinates(double longitude, double latitude) {
        try {
            String urlString = String.format(Locale.US,
                    "http://localhost:5173/api/quartiers/coordinates?longitude=%f&latitude=%f",
                    longitude, latitude
            );

            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000); // 5s timeout
            conn.setReadTimeout(5000);

            int status = conn.getResponseCode();
            if (status != 200) {
                System.err.println("Erreur HTTP : " + status);
                return Optional.empty();
            }

            InputStream is = conn.getInputStream();
            Scanner scanner = new Scanner(is).useDelimiter("\\A");
            String responseBody = scanner.hasNext() ? scanner.next() : "";
            conn.disconnect();

            JSONObject json = new JSONObject(responseBody);

            if (!json.optBoolean("quartierFound", false)) {
                return Optional.empty();
            }

            JSONObject quartier = json.optJSONObject("quartier");
            if (quartier != null && quartier.has("id")) {
                return Optional.of(quartier.getInt("id"));
            }

        } catch (Exception e) {
            System.err.println("Erreur pendant la requête : " + e.getMessage());
        }

        return Optional.empty();
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
