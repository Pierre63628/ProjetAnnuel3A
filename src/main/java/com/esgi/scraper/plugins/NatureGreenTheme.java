package com.esgi.scraper.plugins;


public class NatureGreenTheme implements ThemePlugin {
    
    @Override
    public String getName() {
        return "Vert Nature";
    }
    
    @Override
    public String getDescription() {
        return "Un thème aux couleurs naturelles et apaisantes pour l'application Event Viewer";
    }

    @Override
    public String getStylesheetPath() {
        return "/styles/nature-green-theme.css";
    }
    
    @Override
    public String getAuthor() {
        return "ESGI";
    }
    
    @Override
    public String getVersion() {
        return "1.0";
    }
}
