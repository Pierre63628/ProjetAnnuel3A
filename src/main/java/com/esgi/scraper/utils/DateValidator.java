package com.esgi.scraper.utils;

import org.jetbrains.annotations.NotNull;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.format.DateTimeParseException;
import java.util.Locale;
import java.util.regex.Pattern;

public class DateValidator {

    private static final Pattern TIME_PATTERN = Pattern.compile(".*\\b\\d{1,2}:\\d{2}(?::\\d{2})?(\\s*(AM|PM|am|pm))?\\b.*");
    static DateTimeFormatter formatter = new DateTimeFormatterBuilder()
            .parseCaseInsensitive()
            .appendPattern("EEE")
            .optionalStart()
            .appendLiteral('.')
            .optionalEnd()
            .appendPattern(" d")
            .appendPattern(" MMM")
            .optionalStart()
            .appendLiteral('.')
            .optionalEnd()
            .appendPattern(" yyyy HH:mm")
            .toFormatter(Locale.FRENCH);

    private static String extractFirstPart(@NotNull String dateStr) {
        String firstPart = dateStr.contains(" - ") ? dateStr.split(" - ")[0] : dateStr;
        return firstPart;
    }

    public static boolean isValidEventDate(String dateStr) {
        String cleanDate = extractFirstPart(dateStr);

        if (cleanDate == null || cleanDate.trim().isEmpty()) {
            return false;
        }
        try {
            LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_DATE_TIME);
            return true;
        } catch (DateTimeParseException ignored) {
        }

        if (!TIME_PATTERN.matcher(cleanDate).matches()) {
            return false;
        }

        try {
            LocalDateTime.parse(cleanDate, formatter);
            return true;
        } catch (DateTimeParseException ignored) {
            return false;
        }
    }

    public static String convertToISO8601(String dateStr) {
        String cleanDate = extractFirstPart(dateStr);

        try {
            LocalDateTime dateTime = LocalDateTime.parse(cleanDate, DateTimeFormatter.ISO_DATE_TIME);
            return dateTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (DateTimeParseException ignored) {
        }

        try {
            LocalDateTime dateTime = LocalDateTime.parse(cleanDate, formatter);
            return dateTime.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (DateTimeParseException ignored) {
            System.out.println(("Date string is not in a recognized format: " + dateStr));
        }
        return "N/A";
    }
}