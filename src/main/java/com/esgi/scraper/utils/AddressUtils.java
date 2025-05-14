package com.esgi.scraper.utils;

import java.util.regex.Pattern;

public class AddressUtils {

    public static String cleanAddress(String address) {
        if (address == null || address.isEmpty()) {
            return "";
        }

        String cleaned = address.replaceAll("(?i)(Show map|Afficher la carte|See map|Voir la carte)", "").trim();
        cleaned = cleaned.replaceAll("(?m)^\\s*$\\n", "");
        cleaned = cleaned.replaceAll("\\s+", " ");
        cleaned = cleaned.replaceAll("^[\\s\\p{Punct}]+|[\\s\\p{Punct}]+$", "");
        cleaned = cleaned.replaceAll("\\n", ", ");
        cleaned = cleaned.replaceAll(",\\s*,", ",");
        cleaned = cleaned.replaceAll("^\\s*,\\s*|\\s*,\\s*$", "");
        
        return cleaned;
    }
}
