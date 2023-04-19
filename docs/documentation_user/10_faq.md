# Frequently asked questions

This page contains information about frequently asked questions about AsTeRICS Grid.

## Issues with online text-to-speech voices (lags, not working)
AsTeRICS Grid uses voices from these sources:
* **offline:** voices installed on the operating system (differs depending on platform, Windows has different voices than Android or iOS), e.g. `Microsoft David - English, offline` on a Windows computer
* **online (best quality):** voices from Microsoft, e.g. `Microsoft Eric Online (Natural), online`. These voices are only available in the Microsoft Edge Browser on a Windows computer.
* **online (good quality):**, Google voices, e.g. `Google Deutsch, online`. These voices are only available in Google Chrome browser.
* **online (average quality and sometimes problems with availability):** voices from [responsivevoice.org](https://responsivevoice.org/), e.g. `Spanish Female, online`

As stated the quality and availability of these voices differs, in general **offline voices should be preferred**, because they are most reliable and not depending on an internet connection. Most **problems occur with voices from [responsivevoice.org](https://responsivevoice.org/)**, which is why they only should be used if no alternatives are available.

### Installing additional voices
On most operating systems it's possible to install additional offline voices and afterwards use them in AsTeRICS Grid.

#### Microsoft Windows 10
On Windows 10 follow these steps to install additional voices:
* go to language system settings
* click on "add language"
* search for the language you want to install
* if there is a speech balloon icon next to the language it indicates that a text-to-speech (TTS) voice is available for this language
* it a TTS voice is available for your language, install it, restart the computer and afterwards the new offline voices should be available in AsTeRICS Grid

#### Android
Please follow this tutorial from ARASAAC to read about possibilities to install additional offline voices on an Android device: [ARASAAC tutorial for installing voices on Android](https://aulaabierta.arasaac.org/en/dynamic-communicator-asterics-grid-installation-of-speech-synthesis-tts-android)

#### iOS
With iOS 15 it was possible to use all voices installed on the device within AsTeRICS Grid. With iOS 16 Apple seems to have decided to remove the possibility to use high quality voices within web applications and therefore also to remove them from AsTeRICS Grid. See this [issue on Github about iOS voices](https://github.com/asterics/AsTeRICS-Grid/issues/223) and this [question in the Apple developer forum](https://developer.apple.com/forums/thread/723503) which shows that this isn't a bug but is behaviour that's intended by Apple. We've contacted Apple directly and asked them to revert this change, but didn't receive an answer. If you're experiencing this issue, you can send feedback to Apple directly: [send feedback to Apple](https://www.apple.com/feedback/ipad/).
