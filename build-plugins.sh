#!/bin/bash


mkdir -p plugins

mkdir -p temp/com/esgi/scraper/plugins

echo "Compilation des plugins de thème..."
javac -d temp src/main/java/com/esgi/scraper/plugins/ThemePlugin.java
javac -d temp -cp temp src/main/java/com/esgi/scraper/plugins/*.java

mkdir -p temp/styles

echo "Copie des fichiers CSS..."
cp src/main/resources/styles/dark-theme.css temp/styles/
cp src/main/resources/styles/blue-night-theme.css temp/styles/
cp src/main/resources/styles/nature-green-theme.css temp/styles/

echo "Création des fichiers JAR..."
cd temp
jar cf ../plugins/dark-theme-plugin.jar com/esgi/scraper/plugins/ThemePlugin.class com/esgi/scraper/plugins/DarkTheme.class styles/dark-theme.css
jar cf ../plugins/blue-night-theme-plugin.jar com/esgi/scraper/plugins/ThemePlugin.class com/esgi/scraper/plugins/BlueNightTheme.class styles/blue-night-theme.css
jar cf ../plugins/nature-green-theme-plugin.jar com/esgi/scraper/plugins/ThemePlugin.class com/esgi/scraper/plugins/NatureGreenTheme.class styles/nature-green-theme.css
cd ..

# Nettoyer
echo "Nettoyage..."
rm -rf temp

echo "Plugins compilés avec succès dans le répertoire 'plugins'."
