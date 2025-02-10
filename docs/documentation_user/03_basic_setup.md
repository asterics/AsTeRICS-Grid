# Basic Setup

This chapter provides an overview of the basic setup and basic settings:
- [Welcome View](03_basic_setup.md#welcome-view)
- [Users](03_basic_setup.md#users)
- [Choose How to Start View](03_basic_setup.md#choose-how-to-start-view)
- [General Settings and User Settings](03_basic_setup.md#general-settings-and-user-settings)

[Back to Overview](README.md)

## Welcome View

AsTeRICS Grid initially starts with a welcome view giving the choice between:

1. **Use AsTeRICS Grid without registration:** choose this option in order to create a local default user (**offline user**) and directly start using AsTeRICS Grid.
2. **Register now:** choose this option in order to sign up for an **online user**, which makes it possible to synchronize the grids across devices.

### Users

In AsTeRICS Grid an user in general holds a set of grids which realize a specific solution for this user. A user doesn't necessarily have to be a real person, it's also possible to create an "user" for a specific usecase, for instance a specific smart home control interface.

#### Online users

Online users are users whose configuration is automatically synchronized with a cloud storage. Therefore it's possible to this user to log in on different devices while the configuration is always up-to-date on each device.

The following information is important for registering an online user:
* The only data that is needed are a **username** and a **password**. The username is needed for uniquely identifying a user and the password for securing his account and encrypting the data.
* If you want to **use AsTeRICS Grid completely anonymously** just use a username without any relation to your person.
* Since all data is **end-to-end encrypted** only the user itself can ever see his data and configuration, no server admin or anyone else.
* End-to-end encryption is great for privacy, however it has the drawback that the **data is lost**, if you logout your online account on all devices and forget your password. In this case there is **no possibility of password recovery**, so **remember your password carefully**. It's also recommended to **do backups** of your grids (see [Editing grid set](05_editing-grid-set.md)).
* Usernames must start lowercase, valid characters are [a-z], [0-9] and ["-", "_"], valid length is 3-50 characters.

#### Offline users

Offline users are users whose configuration is only saved offline in the storage of the currently used browser. This type of users are perfectly suited for use cases where AsTeRICS Grid is only used on a single device.

The following information is important regarding offline users:
* All **data of an offline user never leaves the device**, it's stored in a browser-internal database.
* Usernames must start lowercase, valid characters are [a-z], [0-9] and ["-", "_"], valid length is 3-50 characters.

## Choose How to Start View

After logging in for the first time you get to a *Choose how to start* page. Here you can either import a backup or choose one of the suggested grid sets to start. Click on `Details` to learn more about a specific grid set.
Under `More search options` you can filter the suggestions for languages or single grids.
Click on `Use it` to import a specific board.

**Info about Open Board Format (OBF)**: OBF is an open format for exchanging grids across different AAC tools and is specified on the [official website](https://www.openboardformat.org/). AsTeRICS Grid supports importing OBF files (`.obf` and `.obz`) using the options `Restore backup from file` or `Import custom data from file`.

## General Settings and User Settings

Under `Settings -> General` you can select the following settings:

- **Application Language**: Usually the app automatically activates in the language of the browser respectively the operating system, if a translation for that language is available. You can change the app surface to another language, if a translation the desired language exists.
- **Lock user interface**: You can set a password (numbers only) to lock/unlock the user interface. This passwort is then required when exiting the fullscreen mode.
- **Notifications**: Decide how often the app should remind you to make a backup.
- **Synchronize navigation and locked/fullscreen state for online users**: Decide if these settings should apply on this device only or accross all devices for online users.

Under `Settings -> Language` you can select the following settings:
- **Grid current language**: If you're using a [multilingual grid set](13_multilingual-grid-sets.md) you can choose here if the grid set should start with a different language than the application language when accessing it from `Main`
- **Current voice**: Select which voice to use for your monolingual grid set respectively for the language chosen as **Grid current language**. Information on voices can be found in [chapter 11](11_voices.md). If you have a grid set you want to use multilingually, you will have to use the respective action to switch languages and voices (see [chapter 13](13_multilingual-grid-sets.md).)
- **Secondary voice**: If your grid set is translated to other languages you can make it that an element first speaks the label with the voice set as current language and afterwards speaks the label with the voice set as secondary voice. So one can her a label first in one and then the ohter language.
- **Link voice language**: If set, the Spanish voice will automatically speak the Spanish translation (if available), regardless of the "content language" set, i.e. the language of the labels. If not set, then if the voice is Spanish and the labels are German, the Spanish voice will speak the German text.

Under `Settings -> Input Methods` you can select the following settings:
- **General input settings**: Decide the minimum pause  for collecting and speaking the same cell several times in a row.
- **Acoustic Feedback Options**: Settings for feedback options for special input methods can be set here or in the specific [input method](09_input-options.md).

Under `Settings -> Integrations` you can select the following settings:
- **ARASAAC**: If you're using the grid set in Spanish, you can activate an automatic grammar correction.
- **Expternal speech service**: Make additional voices available in the app. This requires knowledge in programming.

[Back to Overview](README.md)