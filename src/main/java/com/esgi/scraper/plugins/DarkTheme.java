package com.esgi.scraper.plugins;


public class DarkTheme implements ThemePlugin {
    
    @Override
    public String getName() {
        return "Thème Sombre";
    }
    
    @Override
    public String getDescription() {
        return "Un thème sombre pour l'application Event Viewer";
    }
    
    @Override
    public String getStylesheetPath() {
        return "/styles/dark-theme.css";
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
