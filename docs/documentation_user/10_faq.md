# Frequently asked questions

This page contains information about frequently asked questions about AsTeRICS Grid.

## Issues with online text-to-speech voices (lags, not working)
AsTeRICS Grid uses voices from these sources:
* **offline:** voices installed on the operating system (differs depending on platform, Windows has different voices than Android or iOS), e.g. `Microsoft David - English, offline` on a Windows computer
* **online (best quality):** voices from Microsoft, e.g. `Microsoft Eric Online (Natural), online`. These voices are only available in the Microsoft Edge Browser on a Windows computer.
* **online (good quality):**, Google voices, e.g. `Google Deutsch, online`. These voices are only available in Google Chrome browser.
* **online (average quality and sometimes problems with availability):** When using voices from [responsivevoice.org](https://responsivevoice.org/), e.g. `Spanish Female, online`, there can be some delay (e.g. 5 seconds or more) until the label is spoken. There are also random errors accessing the voice service.

As stated the quality and availability of these voices differs, in general **offline voices should be preferred**, because they are most reliable and not depending on an internet connection. Most **problems occur with voices from [responsivevoice.org](https://responsivevoice.org/)**, which is why they only should be used if no alternatives are available.

### Installing additional voices
On most operating systems it's possible to install additional offline voices and afterwards use them in AsTeRICS Grid.

#### Microsoft Windows 10
On Windows 10 follow these steps to install additional voices:
1. go to **language system settings**
1. click on **add language**
1. search for the language you want to install
1. if there is a speech balloon icon next to the language it indicates that a text-to-speech (TTS) voice is available for this language:
<div align="center"><img width=350 src="https://user-images.githubusercontent.com/2537025/233000407-6d8410b7-834f-45bb-ab06-d4931340071a.png"/></div>

1. If a TTS voice is available for your language, **install it**!
2. **Restart the computer**: Afterwards the new offline voices should be available in AsTeRICS Grid

#### Android
Please follow this tutorial from ARASAAC to read about possibilities to install additional offline voices on an Android device: [ARASAAC tutorial for installing voices on Android](https://aulaabierta.arasaac.org/en/dynamic-communicator-asterics-grid-installation-of-speech-synthesis-tts-android)

#### iOS
With iOS 15 it was possible to use all voices installed on the device within AsTeRICS Grid. With iOS 16 Apple seems to have decided to remove the possibility to use high quality voices within web applications and therefore also to remove them from AsTeRICS Grid. See this [issue on Github about iOS voices](https://github.com/asterics/AsTeRICS-Grid/issues/223) and this [question in the Apple developer forum](https://developer.apple.com/forums/thread/723503) which shows that this isn't a bug, but is behaviour that's intended by Apple. We've contacted Apple directly and asked them to revert this change, but didn't receive an answer. If you're experiencing this issue, you can send feedback to Apple directly: [send feedback to Apple](https://www.apple.com/feedback/ipad/)

**Update**: with iOS 17 the situation became better again, now for most languages at least one higher quality voice is available for AsTeRICS Grid, also see https://github.com/asterics/AsTeRICS-Grid/issues/223#issuecomment-1729299302

## Can I recover the password of my online user?
We care about the protection of private data that can be inserted into grids, e.g. images or sound recordings. Therefore we've designed AsTeRICS Grid in a way where only the user itself can see his/her data, nobody else. All data of online users is encrypted using the password of the user. So even if we have access to the database, we cannot see anything but encrypted, unreadable data. While that's great for privacy, it also has this major drawback:

It's **not possible to reset or recover the password of an online user**. If the password of an online user is lost, also the data of this user is lost and cannot be recovered.

So there are two things that are important in order to prevent loosing data:
* keep the usernames and passwords of your online users safe, write them down somewhere or use a password safe software for saving them.
* regularily download backups of your user's data to file. AsTeRICS Grid automatically reminds for downloading backups, but it can be done at any time by going to `Manage grids -> More (right top) -> Save backup to file`. Backups saved to file are not encrypted and therefore can be used and imported for a new user.

### Transfer data to new user
If you've lost the password of a user and you're still logged in with this user on any device, just make a backup to file, create a new user and import the data from the backup there. Follow these steps:
* Go to `Manage grids -> More (top right corner) -> Save backup to file`
* Create a new online user (and note your new password somewhere)
* Select `Restore backup from file` at the bottom: <div><img src="https://github.com/asterics/AsTeRICS-Grid/assets/2537025/9333ef5c-899b-458e-8ad5-f142e6c20098" width="400"/></div>
* Continue to use the new online user on other devices

## The global grid disappeared or the "Home" button doesn't work
If the global grid (first line including navigation to "Home" and "Back" and line for collecting elements) disappears or doesn't work as expected any more, try this:
* go to "Manage Grids"
* scroll all down to the bottom of the page
* select the correct home grid at `Select Home grid for creating global Grid`
* Click on `Reset global grid to default`

Also see this screenshot:
![grafik](https://user-images.githubusercontent.com/2537025/235093846-96ec29f7-267f-42b0-8181-d5d6612adffa.png)

