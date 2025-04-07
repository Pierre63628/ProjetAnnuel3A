package com.esgi.scraper.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.text.SimpleDateFormat;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class Utils {

    public static String toJson(List<Map<String, String>> events) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.enable(SerializationFeature.INDENT_OUTPUT);
            mapper.registerModule(new JavaTimeModule());

            mapper.setDateFormat(new SimpleDateFormat("EEE d MMM, HH:mm", new Locale("fr")));

            return mapper.writeValueAsString(events);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Erreur de sérialisation JSON", e);
        }
    }

    public static boolean isValid(String name) {
        return !name.equals("N/A") && !name.isEmpty() && !name.equals(" ");
    }


}
