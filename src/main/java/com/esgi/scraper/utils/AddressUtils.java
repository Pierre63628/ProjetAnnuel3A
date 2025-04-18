package com.esgi.scraper.utils;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import lombok.extern.log4j.Log4j2;
import org.json.JSONArray;
import org.json.JSONObject;


@Log4j2
public class AddressUtils {

    public static String cleanAddress(String address) {
        if (address == null || address.isEmpty()) {
            address = "";
        }
        Pattern pattern = Pattern.compile("\\n(.*?)\\n");
        Matcher matcher = pattern.matcher(address);

        if (matcher.find()) {
            String adresse = matcher.group(1);
            return adresse;
        }

        return "";
    }

    public static Map<String, String> extractAddress(String address) {
        Map<String, String> result = new HashMap<>();
        String addresses = cleanAddress(address);
        try {
            var features = getObjects(addresses);

            if (!features.isEmpty()) {
                JSONObject firstFeature = features.getJSONObject(0);

                JSONObject properties = firstFeature.getJSONObject("properties");
                String label = properties.getString("label");
                result.put("adresse", label);

                JSONObject geometry = firstFeature.getJSONObject("geometry");
                JSONArray coords = geometry.getJSONArray("coordinates");
                String localisation = coords.getDouble(0) + ", " + coords.getDouble(1);
                result.put("location", localisation);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return result;
    }

    private static JSONArray getObjects(String address) throws IOException {

        try {
            String apiUrl = "https://api-adresse.data.gouv.fr/search/?q=" + address.replace(" ", "+");

            URL url = new URL(apiUrl);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");

            BufferedReader in = new BufferedReader(
                    new InputStreamReader(conn.getInputStream())
            );
            String inputLine;
            StringBuilder response = new StringBuilder();
            while ((inputLine = in.readLine()) != null) {
                response.append(inputLine);
            }
            in.close();

            JSONObject json = new JSONObject(response.toString());
            JSONArray features = json.getJSONArray("features");
            return features;
        } catch (Exception e) {
            log.info("Error: " + e.getMessage());
        }
        return new JSONArray();
    }

}
