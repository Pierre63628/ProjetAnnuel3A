package com.esgi.scraper.plugins;

import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.net.URLClassLoader;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.List;
import java.util.jar.JarEntry;
import java.util.jar.JarFile;

public class PluginLoader {
    
    private static final String PLUGINS_DIRECTORY = "plugins";

    public List<ThemePlugin> loadThemePlugins() {
        List<ThemePlugin> plugins = new ArrayList<>();
        plugins.add(new DefaultTheme());
        
        File pluginsDir = new File(PLUGINS_DIRECTORY);
        if (!pluginsDir.exists()) {
            pluginsDir.mkdirs();
            System.out.println("Répertoire des plugins créé: " + pluginsDir.getAbsolutePath());
            return plugins;
        }
        
        File[] jarFiles = pluginsDir.listFiles((dir, name) -> name.endsWith(".jar"));
        if (jarFiles == null || jarFiles.length == 0) {
            System.out.println("Aucun plugin trouvé dans " + pluginsDir.getAbsolutePath());
            return plugins;
        }
        
        for (File jarFile : jarFiles) {
            try {
                JarFile jar = new JarFile(jarFile);
                URL[] urls = { new URL("jar:file:" + jarFile.getAbsolutePath() + "!/") };
                URLClassLoader classLoader = new URLClassLoader(urls, getClass().getClassLoader());
                
                Enumeration<JarEntry> entries = jar.entries();
                while (entries.hasMoreElements()) {
                    JarEntry entry = entries.nextElement();
                    if (entry.getName().endsWith(".class")) {
                        String className = entry.getName().replace('/', '.').replace('\\', '.').replace(".class", "");
                        
                        try {
                            Class<?> clazz = classLoader.loadClass(className);
                            
                            if (ThemePlugin.class.isAssignableFrom(clazz) && !clazz.isInterface()) {
                                ThemePlugin plugin = (ThemePlugin) clazz.getDeclaredConstructor().newInstance();
                                plugins.add(plugin);
                                System.out.println("Plugin de thème chargé: " + plugin.getName() + " (" + plugin.getVersion() + ")");
                            }
                        } catch (Exception e) {
                            System.err.println("Erreur lors du chargement de la classe " + className + ": " + e.getMessage());
                        }
                    }
                }
                
                jar.close();
            } catch (IOException e) {
                System.err.println("Erreur lors du chargement du plugin " + jarFile.getName() + ": " + e.getMessage());
            }
        }
        
        return plugins;
    }
    
    /**
     * Classe interne représentant le thème par défaut de l'application
     */
    private static class DefaultTheme implements ThemePlugin {
        @Override
        public String getName() {
            return "Thème par défaut";
        }
        
        @Override
        public String getDescription() {
            return "Le thème par défaut de l'application Event Viewer";
        }
        
        @Override
        public String getStylesheetPath() {
            return "/styles/application.css";
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
}
