// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id("com.android.application") version "8.7.3" apply false
    id("com.android.library") version "8.7.3" apply false
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false
}

val variablesFile = file("variables.gradle")
if (variablesFile.exists()) {
    apply(from = "variables.gradle")
}

allprojects {
    extra.set("compileSdkVersion", 35)
    extra.set("minSdkVersion", 26)
    extra.set("targetSdkVersion", 35)
    extra.set("androidxActivityVersion", "1.9.3")
    extra.set("androidxAppCompatVersion", "1.7.0")
    extra.set("androidxCoordinatorLayoutVersion", "1.2.0")
    extra.set("androidxCoreVersion", "1.15.0")
    extra.set("androidxFragmentVersion", "1.8.5")
    extra.set("androidxWebkitVersion", "1.12.1")
    extra.set("junitVersion", "4.13.2")
    extra.set("androidxJunitVersion", "1.2.1")
    extra.set("androidxEspressoCoreVersion", "3.6.1")
    extra.set("cordovaAndroidVersion", "10.1.1")
}

tasks.register<Delete>("clean") {
    delete(rootProject.layout.buildDirectory)
}

