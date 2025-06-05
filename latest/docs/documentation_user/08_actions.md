# Grid element actions

This chapter is about actions that can be performed if a grid element is selected and how to configure them. The basic configuration of actions (adding and removing them) is described in [tab actions of chapter "grid elements"](07_grid-elements.md#tab-actions).

[Back to Overview](README.md)

* [Speak label](08_actions.md#speak-label): speaks the label of the element using a computer voice (text-to-speech)
* [Navigate to other grid](08_actions.md#navigate-to-other-grid): navigates to another grid
* [Speak custom text](08_actions.md#speak-custom-text): speaks a customizeable text using a computer voice (text-to-speech)
* [Play recorded audio](08_actions.md#play-recorded-audio): plays custom audio, previously recorded via the microphone of the device
* [Change word forms](08_actions.md#change-word-forms): change the word forms of elements
* [Fill prediction elements](08_actions.md#fill-prediction-elements): fills all [prediction elements](01_terms.md#grid-element) in the current grid with word suggestions
* [Collect element action](08_actions.md#collect-element-action): performs actions on [collect elements](01_terms.md#grid-element) in the current grid, e.g. clearing it or copying it's text to clipboard
* [AsTeRICS Action](08_actions.md#asterics-action): does an action in a running [model](01_terms.md#asterics-model) in the [AsTeRICS Framework](01_terms.md#asterics-framework)
* [openHAB Action](08_actions.md#openhab-action): allows to do environmental control using devices interfaced by the OpenHAB framework
* [Web radio action](08_actions.md#web-radio-action): controls playback of web radios
* [YouTube action](08_actions.md#youtube-action): controls playback of YouTube videos within AsTeRICS Grid
* [Podcast action](08_actions.md#podcast-action): controls playback of podcasts within AsTeRICS Grid
* [Change Content Language](08_actions.md#change-content-language): changes the content language (description of grid elements / language of the communicator grid(s)) and the voice
* [Open webpage in new tab](08_actions.md#open-webpage-in-new-tab): allows to assign an external web page to a cell and opens it in a new tab
* [HTTP action](08_actions.md#http-action): allows to execute commands on programs and devices providing a REST API through HTTP.
* [UART action](08_actions.md#uart-action): allows to execute commands on microcontrollers providing a UART (Serial) interface (wired or Bluetooth).
* [System action](08_actions.md#system-action): actions related to the application, e.g. setting the system volume
* [Predefined actions](08_actions.md#predefined-actions): a way to implement other actions, e.g. http actions, with less programming knowledge
* [Matrix messenger actions](13_matrix-messenger-integration.md#matrix-messenger-actions) in docs about Matrix messenger integration

## Speak label

Clicking on "Edit" of a "speak label" action (or creating a new one by clicking on *Add action*) shows the following configuration possibilities (Figure 2):

![action speak label](./img/action_speak_label_en.jpg)

*Figure 2: Configuration possibilites of "Speak label"*

Clicking on the "Test" button speaks the label in the selected language.  

## Navigate to other grid

![action navigate to other grid](./img/action_navigate_en1.jpg)

*Figure 3: Configuration possibilites of "Navigate to other grid"*

Clicking on "Edit" of a "navigate to other grid" action (or creating a new one) shows the following configuration possibilities (Figure 3):

* **Navigation type**: allows to choose which type of navigation should be performed:
   * **Navigate to grid**: navigates to any other grid that is selected by name. This type has this additional property:
      * *Navigate to grid*: allows you to select the grid to switch to if this action is performed. The combobox contains a list of the names of all available grids of the current user.
   * **Navigate to home grid**: navigates to the home grid
   * **Navigate to last opened grid**: navigates to the previously opened grid, can be used for a "back" functionality
   * **Open search dialog**: opens the search dialog, which allows to navigate to any element in the current configuration
       * *Search for custom text*: if specified the custom text is used to pre-fill the text in the search bar (optional)
       * *Search for collected text*: if checked the currently collected text of the collect element is used to pre-fill the search bar
* **Add this element to collection elements despite navigating**: if checked, this element is added to the collect element, despite the fact that it navigates to another grid.

## Speak custom text

Clicking on "Edit" of a "speak custom text" action (or creating a new one) shows the following configuration possibilities:

![Speak custom text](./img/action_speak_custom_en.jpg)

*Figure 4: Configuration possibilites of "Speak custom text"*

"Text to speak" is the custom text that should be spoken. The button "Test" tests the configuration and speaks the current text.

## Play recorded audio

![Play recorded audio](./img/action_play_recorded_audio.png)

*Figure 5: Configuration possibilities of action "Play recorded audio"*

After clicking **Record** for the first time, the browser will show a confirmation popup to ask if it's allowed to access the microphone. After confirmation the record starts and can be stopped by clicking on the same button again.

With the button **Play** an existing recording can be played.

**Notes**:
* an existing action containing recorded audio has priority over actions *Speak label* and *Speak custom text*. So if an action with recorded audio is present, these types of actions won't be performed.
* if items are collected in collect elements, recorded audio is only played for collect element actions in mode "speak separately", see [Collect element action](08_actions.md#collect-element-action).

## Change word forms

The action allows you to change shown word forms in other elements. This is useful for setting up grammar-related functions. Read [word forms](07a_word-forms.md) for a detailed description.

## Fill prediction elements

**Video on YouTube:** [Prediction elements](https://www.youtube.com/watch?v=t0FWZcM9TMg&list=PL0UXHkT03dGrIHldlEKR0ZWfNMkShuTNz&index=22&t=0s) (German, but auto-translated subtitles available)

The action "fill prediction elements" fills all [prediction elements](01_terms.md#grid-element) in the grid with word suggestions. Suggestions are calculated on the basis of the label of the current element, so an "fill prediction elements" action of an element with label "A" will fill the prediction elements with the most common words starting with character "A":

![fill prediction elements animation](./img/fill_predictions.gif)

Clicking on "Edit" on a "fill prediction elements" action (or creating a new one) shows the following configuration possibilities:

![fill prediction elements action options](./img/action_fillprediction_en.jpg)

*Figure 6: Configuration possibilites of "Fill prediction elements"*

**Dictionary to use**: select the dictionary you want to use (see [manage dictionaries](10_dictionaries.md). If nothing selected words from all available dictionaries will be suggested.

If a `fill prediction elements` action is added to a [collect element](07_grid-elements.md#collect-elements), there is an additional option `Refresh suggestions on change`. If this option is activated, predictions (suggestions) are always updated, after the content of the collect element changes. In this way it's easy to set up a keyboard with word predictions without having to set a "fill prediction elements" action on each letter of the keyboard.

## Collect element action

**Video on YouTube:** [Collect elements](https://www.youtube.com/watch?v=X6YrWJW2ZoM&list=PL0UXHkT03dGrIHldlEKR0ZWfNMkShuTNz&index=21&t=0s) (German, but auto-translated subtitles available)

Collect element actions are various actions that are related to [collect elements](01_terms.md#grid-element). 

Clicking on "Edit" of a "collect element action" action (or creating a new one) shows the following configuration possibilities:

![Collect element action options](./img/action_collectelement_en.jpg)

*Figure 7: Configuration possibilites of "Collect element action"*

The possible actions to choose are (when opening the combo box):

1. **Speak collect element content (separately)**: speaks out the content of the collect element, where each collected element is spoken one by one, highlighting the currently spoken element.
1. **Speak collect element content (continuously)**: speaks out the content of the collect element as continuous text, not highlighting the currently spoken element.
1. **Speak collect element content (separately) and clear afterwards**: see above, clears collect element content after speaking
1. **Speak collect element content (continuously) and clear afterwards**: see above, clears collect element content after speaking
1. **Clear collect element** empties the collect element
1. **Delete last word/image** deletes the last word/image of the collection elements: <div style="margin-left: 2em"><img src="./img/collect_delete.gif" alt="Delete last word animation" width="350"/></div>
1. **Delete last character**: <div style="margin-left: 2em"><img src="./img/collect_delete_c.gif" alt="Delete last character animation" width="350"/></div>
1. **Share as image**: share the current content of the collect element as image using the native "share" functionality of the browser.
1. **Copy image to clipboard**: copies the current image of the collect element to clipboard in order to be available for paste in other programs
1. **Copy text to clipboard**: copies the current text of the collect element to clipboard in order to be available for paste in other programs
1. **Append text to clipboard**: appends the current text of the collect element to clipboard making it possible to collect longer texts in the clipboard which can be used in another program afterwards
1. **Clear clipboard**: empties the clipboard
1. **Search text on YouTube**: searches the currently collected text on YouTube and loads the first video of the result in a YouTube player element. The YouTube player element can be located within the current grid or within another one to which is concurrently navigated to. 

## AsTeRICS Action

**Video on YouTube:** [AsTeRICS actions](https://www.youtube.com/watch?v=geLtm07HRKc&list=PL0UXHkT03dGrIHldlEKR0ZWfNMkShuTNz&index=24&t=0s) (German, but auto-translated subtitles available)

An "AsTeRICS action" performs an action in a running [model](01_terms.md#asterics-model) in the [AsTeRICS Framework](01_terms.md#asterics-framework). This can be any action that is possible with the AsTeRICS Framework, e.g. controlling a TV or performing computer actions like opening a program.

Figure 8 shows how an AsTeRICS action that controls a TV is working in more detail:

![asterics action detail concept](./img/asterics-action-are_en.png)

*Figure 8: AsTeRICS action concept, example of controlling a TV*

The following steps are shown in Figure 8:

1. A user selects a grid element with an associated AsTeRICS action. An [AsTeRICS model](01_terms.md#asterics-model) which can perform the desired action (e.g. controlling a TV) is saved within the current grid.
2. The AsTeRICS model is uploaded to a running instance of the AsTeRICS Framework (ARE) and afterwards started. The model contains so-called "plugins" which are elements capable of communicating with external hardware, e.g. attached to the computer or accessible via network. In the example the "IrTrans" plugin is capable of communicating with an IrTrans device, which is a replacement for infrared remotes.
3. After uploading and starting the model on the AsTeRICS Framework, data is sent to a plugin contained in the model. In Figure 8 some data is sent to the "action" port of the IrTrans plugin.
4. Sending data to the plugin causes the AsTeRICS Framework to communicate with the external real "IrTrans" hardware. The action contains the needed information to perform the desired action, for instance sending a "Volume down" command to a TV.
5. Finally the IrTrans device sends the infrared signal to the TV causing it to reduce the volume.

Clicking on "Edit" on a "AsTeRICS action" action (or creating a new one) shows the following configuration possibilities:

![asterics action options](./img/action_asterics_en.jpg)

*Figure 9: Configuration possibilites of "AsTeRICS action"*

These are the possibilities while configuring an AsTeRICS action:

1. **ARE URL**: the URL of a running ARE (AsTeRICS Framework) to connect with. Standard URL is `http://127.0.0.1:8081/rest/` for a locally running ARE.
2. **Test URL**: click in order to test the current URL. A tick (&#10003;) or times (&times;) symbol will indicate if the test was successful or has failed.
3. **ARE Model**: if there is already a [model](01_terms.md#asterics-model) of this action defined, the name of it is shown here. A click on the link downloads the model.
4. **Download from ARE**: downloads the currently running model from a running AsTeRICS Framework (ARE) instance and saves it to the grid. The current ARE model is replaced by this action.
5. **Upload to ARE**: uploads the saved model to a running AsTeRICS Framework (ARE) for testing purpose or in order to adapt it.
6. **Component**: selection of the component (plugin) of the selected model that should be used
7. **Send data to port**: define port the data should be sent
8. **Data**: define data that should be sent to the port determined above (number 7)
9. **Event-Port**: define the event that should be triggered (optional)
10. **Cancel**: discard any changes and close the modal
11. **OK**: save all changes and close the modal
12. **OK, edit previous**: save all changes and edit the actions of the previous element
13. **OK, edit next**: save all changes and edit the actions of the next element
14. **End edit**: apply changes and close edit mode of this AsTeRICS action
15. **Delete**: delete this action from this grid element
16. **Test**: performs the defined AsTeRICS action for testing, same as will be later performed if the grid element is selected

**Trigger event**: selects an event that should be triggered on the selected component (optional, either "send data", "trigger event" or both can be used)


## openHAB Action

AsTeRICS Grid is capable of controlling a local openHAB installation through the browser. This action utilizes the REST
API of openHAB (see [openHAB API documentation](https://www.openhab.org/docs/configuration/restdocs.html)).

Figure 10 shows the configuration possibilities of an openHAB action:

![openHAB action options](./img/openHAB-configuration.png)

*Figure 10: Defining a new openHAB action*

These are the elements in this configuration dialog:

1. **openHAB URL**: the URL of a running openHAB instance to connect with. Standard URL is `http://127.0.0.1:8080/rest/items/` for a local openHAB instance.
2. **Fetch Items**: click in order to fetch all available items from the current URL. A tick (&#10003;) or times (&times;) symbol will indicate if fetching was successful or has failed.
3. **Filter through item types**: filter fetched items with its item type (see [controllable Items](08_actions.md#controllable-items) for what items are controllable). By default, all items are selected. 
4. **Search for items by name**: search for items by name.
5. **Select item**: all or filtered items will be listed in a dropdown menu.
6. **Choose command to send**: according to the item type, a selection of commands will be available.
7. **Create grid elements**: this button allows to create grid elements for all actions of the currently selected items. Note that generated grid elements will only appear after clicking "OK" in the grid element edit modal. 
8. **Choose custom value for item (optional)**: some items (Dimmer, Color, Roller shutter, Temperature) can be controlled with custom values (e.g.: absolute value for dimmer, custom color). The input variant for the specific item will change accordingly.

When editing an already created action, selecting a new item will be disabled and only the action for the current command can be changed.
If the item should be changed, it is required to fetch the items again.
After the items are fetched, the action can be configured as if it was created new.

### Controllable items

Following items are implemented and controllable via the action:

- **Switch**:
  Includes items like light switches, switches for automations, switches for outlets, ...
- **Dimmer**:
  Includes all dimmable lights
- **Roller shutter**:
  Includes all roller shutter and blinds
- **Color**:
  Includes all multicolor lights
- **Temperature**:
  Inlcudes items with a setable temperature like thermostats
- **Media player**:
  Includes all media player devices

An item must be implemented in openHAB in order to be accessible via the action.

### Notes:

- In order to use this action, CORS must be enabled by your openHAB installation. Otherwise, openHAB will deny the
  action calls.
- You must be in the same network as your openHAB installation.
- Basic Authentication is not supported.

### Accessing openHAB via http/https

By default, the action searches for a local openHAB instance on port 8080.
If the openHAB installation is hosted in the local network, there are two possible ways to access it via the browser:

- **http**:
  If you are using openHAB over http with port 8080, you need to allow your browser to use ***mixed content***.
  Otherwise, the browser has no permission to access your local network.
- **https**:
  If you are using openHAB over https with port 8443, some browser need a one-time-exception to use the resources from
  the REST-API.
    - **Google Chrome**:
      Does not require additional steps for using the REST-API over https.
    - **Firefox and Safari**:
      In order to use the REST-API, a new tab with the address `https://<openHAB-IP-address>:8443/rest/items` must be
      opened. Firefox/Safari will prompt that this resource is insecure. By allowing to show the content of this website,
      an exception is created to allow general connections to the resource. After granting this exception, the
      openHAB-Action can access openHAB via https. Figure 11 shows an example of such a security prompt.

<img src="./img/openHAB-https-exception.png" title="openHAB action set browser exception" width="700"/>

*Figure 11: Example of a security prompt by Firefox*

## Web radio action

**Video on YouTube:** [Web radio](https://www.youtube.com/watch?v=dKZwan9dZV4&list=PL0UXHkT03dGrIHldlEKR0ZWfNMkShuTNz&index=23&t=0s) (German, but auto-translated subtitles available)

AsTeRICS Grid is capable of searching and playing web radio stations. The station search capabilities are powered by the API of <a href="https://www.radio-browser.info/gui/#!/" target="_blank">radio-browser.info</a>.

Clicking on "Edit" on a "Web radio action" (or creating a new one) shows the following configuration possibilities:

![Web radio action options](./img/action_webradio_en.jpg)

*Figure 12: Configuration possibilites of "Web radio action"*

These are the elements in this configuration dialog:

1. **End edit**: apply changes and close edit mode of this Web radio action
2. **Delete**: delete this action from this grid element
3. **Test**: performs the defined Web radio action for testing, same as will be later performed if the grid element is selected
4. **Web radio action**: chooses the type of web radio action to perform which can be one of the following:
   * *Turn radio on*: turns on the radio with the channel selected at *Webradio to play*
   * *Turn radio on/off*: toggles the radio on/off state with the channel selected at *Webradio to play*
   * *Turn radio off*: turns the radio off
   * *Next radio channel*: moves to next radio channel in the list of selected radio stations, see (4)
   * *Previous radio channel*: moves to previous radio channel in the list of selected radio stations, see (4)
   * *Radio volume up*: increases the radio volume
   * *Radio volume down*: decreases the radio volume
5. **Webradio to play**: chooses which radio to play (only visible for *Turn radio on* and *Turn radio on/off*), possible channels to select are defined in selected radio stations list, see (4)
6. **Manage webradio list**: accordion which folds/unfolds the section where radio stations can be searched and selected
7. **Create grid elements for webradios**: As many radio stations selected, as many grid elements will be created, each element corresponding to one of the selected radio stations
8. **Selected radio stations list**: list of selected radio stations which are available within the current grid
9. **Up**: moves the station up in the list (reordering)
10. **Play**: plays the radio channel
11. **Remove**: removes the radio channel from the list of selected radio stations
12. **Search term input**: search bar for searching new radio stations. By default search is done for radio station name, but the following additional properties are possible (see [API documentation](http://www.radio-browser.info/webservice#Advanced_station_search)): *name (default), country, state, language, tag, tagList, order*. To use this additional properties they have to be added with semicolon to the search term. 
    * *Examples*: The search term for looking for austrian radio stations with name `Hitradio` would be: `name:Hitradio country:austria`. If the search term is just `Hitradio` search will be done for radio stations with this name.
13. **Webradio search result list**: result list for the current search term
14. **Play**: plays the radio station
15. **Select**: adds the radio station to the list of selected radio stations, see (8)
16. **Previous page**: navigates to the previous page of search results (if available)
17. **Next page**: navigates to the next page of search results (if available)

## YouTube action

The YouTube Action allows you to link videos from this web page to the communicator and view them without leavting the communicator. Different control functions can be assigned to the cells for the display of the videos.

Clicking on "Edit" of a "YouTube" action (or creating a new one by clicking on *Add action*) shows the following configuration possibilities (Figure 13):

<img src="./img/action_youtube_en.JPG" width="800"/>

*Figure 13: Configuration possibilites of "YouTube Action"*

The possible actions/functions to choose are (when opening the combo box):

1. **Play video** 
   * Play type (Play single video, Play playlist, Play videos from search query, Play videos from channel)
   * Video link: insert the YouTube Video link here
   * Show video subtitles (if available): can be de/activated
   * Start video muted: can be de/activated
   * Perfrom action after navigation: can be de/activated
2. **Pause video**
3. **Play/Pause video**: same options like in *Play video*
4. **Restart video**: same options like in *Play video*
5. **Stop video**
6. **Step forward within video**
   * Step forward within video (seconds):  the number typed in represents the time in seconds the video will be fast-forwarded
7. **Step backward within video**
   * Step backward within video (seconds): the number typed in represents the time in seconds the video will be rewound
8. **Next video**
9. **Previous video**
10. **Show video in fullscreen**
11. **Video volume up**
    * Vido volume up (percent): the number typed in represents the percentage the volume will be volumed up
12. **Video volume down** 
    * Vido volume down (percent): the number typed in represents the percentage the volume will be volumed down
13. **Mute/unmute video**

To add a "YouTube Grid", one grid element hast to be a "YouTube Player", which can be created in the "Editing on view" in the menu "more" → 'New' → " New You Tube Player", as can be seen in Figure 14:

![action youtubeplayer](./img/youtubeplayer_en.JPG)

*Figure 14: Creating a New YouTube Player element"*

Other ("normal") grid elements can be assigned with the functions listed above and a corresponding image can be chosen in the *Image Tab*. In ARASAAC, a collection of multimedia buttons is prepared, just type the word *button* in the *Image search* field of the *Image Tab*. If different grid elements are assigned with the *Play video* functions and are linked to different YouTube videos, the selected video will be played in the "YouTube Player" element, which has been created as shown in Figure 14.

## Podcast action

Podcast actions allow to control playback of podcasts within AsTeRICS Grid. The integrated podcast search uses [podcastindex.org](https://podcastindex.org/), a free web service that provides a global index of podcasts and episodes.

Clicking "Edit" on a "Podcast action" (or creating a new one) shows the following configuration possibilities:

![Web radio action options](./img/action_podcast.png)

*Figure: Configuration options of "Podcast action"*

These are the elements in this configuration dialog:

1. **Podcast action**: choose which podcast action to perform. Can be one of these:
   * **Play**: play the latest or last heard episode of the selected podcast
   * **Pause**
   * **Toggle play/pause**: play or pause, depending on current state
   * **Step forward**: skip forward by a configurable number of seconds
   * **Step backward**: skip backward by a configurable number of seconds
   * **Latest episode**: play the latest episode of selected podcast
   * **Next episode**: play the next episode of selected podcast
   * **Previous episode**: play the previous episode of selected podcast
   * **Volume up**
   * **Volume down**
1. **Podcast to play**: select which podcast to play, can be `automatic` (last played) or a specific podcast from the list "selected podcasts" below.
1. **Manage podcasts**: accordion where it's possible to search and select podcasts 
1. **Selected podcasts**: list of podcasts selected by the user (afterward available above in "podcast to play")
1. **Create grid elements for podcasts**: create a grid element for each selected podcast with image of the podcast cover and action to toggle play/pause for this podcast
1. **Actions for selected podcasts**: rearrange selected podcasts (move up using the `Up` button), test it by playing or remove it from the list of selected podcasts 
1. **Podcast search**: search for new podcasts with a search term 
1. **Actions for found podcast list**: test the podcast using `Play` or add it to the selected podcasts using `Select`

There is a [podcast demo configuration](https://grid.asterics.eu/?gridset_filename=podcast_demo.grd.json) available for testing all of these actions.

## Change Content Language / Voice

This action is used to change the language and/or the voice of the communicator grid(s). 
For more information see [multilingual grid sets](12_multilingual-grid-sets.md#switching-languages) and [chapter voices](11_voices.md).

## Open webpage in new tab

This action allows to assign an external web page to a grid element and, by clicking on it, to access the information contained therein.

Clicking on "Edit" of a "Open webpage in new tab" action (or creating a new one by clicking on *Add action*) shows the following configuration possibilities (Figure 15):

<img src="./img/action_openwebpage_en.JPG" width="850"/>

*Figure 15: Configuration possibilites of "Open webpage in new tab"*

* **Webpage URL**: copy the URL of the desired webpage and enter it here
* **Automatically close timeout in seconds**: enter time in seconds you want the tab remains open. After this time, the web page will close and the communicator grid will be displayed again

By clicking on the grid elemnt this action is assigned to, the chosen webpage is accessed and the user can navigate in it for the time which was set. After this time, the webpage will be closed and the user will return to the communicator. 

## HTTP action

This action can send arbitrary HTTP requests, e.g. for accessing any REST API.

![Configuration of a HTTP action](./img/action-http.png)

*Figure 16: Configuration of a HTTP action*

Figure 16 shows the configuration of a HTTP action, which has these properties:
1. **HTTP URL**: the URL where the request should be sent to
1. **HTTP body**: the data that should be sent within the request (not applicable for HTTP method `GET` and `HEAD`)
1. **HTTP method**: the method to be used for the request. Can be `GET`, `POST`, `PUT`, `DELETE`, `HEAD`, `OPTIONS` and `PATCH`
1. **HTTP Content-Type**: the Content-Type of the request, defaults to `text/plain`
1. **HTTP Authentication User**: the (optional) username for HTTP authentication 
1. **HTTP Authentication Password**: the (optional) password for HTTP authentication

Any errors from requests will be shown in a popup in the lower right corner of the application.

For tutorials, see [HTTP action tutorials](tutorials/01_http-action-tutorials.md).

## UART action

This action allows sending commands to microcontrollers using the UART (Serial) interface. The connections can be wired (using [Web Serial](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API), Chrome/Edge-Desktop) or wireless (using [Web Bluetooth](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API), Chrome/Edge-Desktop/Mobile). 

### Example use cases

* Creating a remote control for a TV by sending Infrared commands to the Open Source microcontroller [Puck.js](https://www.puck-js.com/). The commands can be directly copied from the [puckmote](https://asterics.github.io/puckmote/) online remote control database.
* Creating accessible battery-powered toys (e.g. soap bubble machine, disco light or duplo train)
* Creating a mouse click or keyboard input using the button interface FABI or the mouth mouse FLipMouse.

### Supported devices

* [Devices supported by Espruino](https://www.espruino.com/Other+Boards#boards-that-espruino-works-on), e.g. [Puck.js](https://www.puck-js.com/)
* [Flexible Assistive Button Interface (FABI)](https://www.asterics-foundation.org/projects/fabi/)
* [Finger and Lip mouse (FLipMouse)](https://www.asterics-foundation.org/projects/the-flipmouse/)

### Supported commands

![image](https://github.com/asterics/AsTeRICS-Grid/assets/4621810/a1f3d53c-0237-4342-a85d-90d745d2f0d9)

*Figure 17: Configuration of a UART action.*

The action supports the following input fields:
1. **UART Type**: Choose between ```Bluetooth``` and ```Serial```(wired)
2. **Data**: A string to be executed on the microcontroller (e.g. Javascript code (Espruino devices) or AT commands (FABI, FLipMouse)).

For tutorials, see [UART action tutorials](tutorials/02_uart-action-tutorials.md).

## System action
A system action allows to do some action related to the current application state. These are the possible system actions:
* **System volume up/down/toggle**: allows to increase, decrease or mute the system volume. It affects the volume of all other sounds within AsTeRICS Grid, which are voice volume for speaking elements, webradio volume and YouTube volume.
* **Enter/leave fullscreen**: allows to enter or leave fullscreen
* **Update live elements**: updates the values of all currently visible live elements

## Predefined actions

Predefined actions are a special category of actions. They wrap other actions for being able to set them up in a more user-friendly way. The most common use-case is wrapping HTTP actions for devices with a REST API, but also all other actions could be wrapped. The possible predefined actions are defined within the external repository [AsTeRICS Grid Boards](https://github.com/asterics/AsTeRICS-Grid-Boards?tab=readme-ov-file#predefined-actions).

### Example

To understand the concept, this example shows a comparison between the same action performed for a [Shelly Plug S](https://shelly-api-docs.shelly.cloud/gen2/Devices/Gen3/ShellyPlugSG3) device using a HTTP action and a Predefined action:

![HTTP action vs. predefined action](img/action-predef-comparison.png)

*Fig. 24: Comparison of a HTTP action vs. a Predefined action for turning on a Shelly Plug S via its cloud API. The Predefined action is much easier to configure, because it doesn't need any specific knowledge about the API endpoint (address path, HTTP method, parameter names).*


### Browser support

Accessing local APIs at local IP addresses like `192.168.0.10` is not allowed by all browsers. Some allow it only in a secure context (`https`, so using the [main https version of AsTeRICS Grid](https://grid.asterics.eu/)), some allow it only in a insecure context (`http`, so using the [main http version of AsTeRICS Grid](http://grid.asterics-foundation.org/)) and some only if a special setting for allowing `mixed-content` is set. If you want to use local APIs within AsTeRICS Grid, please do your own research about the current situation with internet searches like `<your-browser> <your-operating-system> allow mixed content`, e.g. "Chrome Android allow mixed content". There is also further info in the [FAQ](faq.md#allow-mixed-content-httphttps).

For tutorials, see [tutorials for predefined actions](tutorials/03_predefined-action-tutorials.md).

[Back to Overview](README.md)
