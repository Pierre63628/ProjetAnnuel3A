package com.esgi.scraper.plugins;

/**
 * Exemple de plugin de thème "Bleu Nuit"
 */
public class BlueNightTheme implements ThemePlugin {
    
    @Override
    public String getName() {
        return "Bleu Nuit";
    }
    
    @Override
    public String getDescription() {
        return "Un thème élégant aux tons bleu nuit pour l'application Event Viewer";
    }
    
    @Override
    public String getStylesheetPath() {
        return "/styles/blue-night-theme.css";
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
