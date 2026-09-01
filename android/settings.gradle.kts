pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_PROJECT)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "AriaAI"
include(":app")

// Capacitor Android Module
include(":capacitor-android")
project(":capacitor-android").projectDir = file("../node_modules/@capacitor/android/capacitor")

// Capacitor Cordova Plugins Module if present
val cordovaPluginsDir = file("capacitor-cordova-android-plugins")
if (cordovaPluginsDir.exists()) {
    include(":capacitor-cordova-android-plugins")
    project(":capacitor-cordova-android-plugins").projectDir = cordovaPluginsDir
}

