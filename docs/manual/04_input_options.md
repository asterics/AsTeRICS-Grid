# Input Options
This chapter is about how grid elements can be selected with different input modalities.

[Back to Overview](00_index.md)

Clicking on Button "Input Options" in [Main view](02_navigation.md#main-view) opens a configuration modal:

![input options](img/input_options_en.jpg)

These are the possible options:

1. **Enable Scanning**: enables the "scanning" method, which means that grid elements are consecutively highlighted and the user can select the desired element just by a single input channel, e.g. a single keyboard key or a tap anywhere on the touch-screen.
1. **Enable Hovering**: enables the "hovering" input method, which means that grid elements selected by keeping the mouse cursor positioned on an element for a specific amount of time. On a touchscreen it means that elements are selected by tap-and-hold on them for some duration.
1. **Hover Time**: the time in milliseconds to dwell on an element in order to select it (if hovering enabled)
1. **Select with mouse click**: selects an element by just clicking on it (tap on touchscreen)

## Scanning options
If scanning is enabled there are several additional options for this input method:

![input options](img/scanning_options_en.jpg)

1. **Vertical scanning** defines the direction of scanning:
    * **vertical** (checked): groups are built vertical, moving left to right <div style="margin-left: 2em"><img src="img/scanning_vertical.gif" alt="vertical scanning" width="130"/></div>
    * **horizontal** (unchecked): groups are built horizontal, moving top to bottom <div style="margin-left: 2em"><img src="img/scanning_horizontal.gif" alt="horizontal scanning" width="130" style="margin-left: 2em"/></div>
1. **Binary scanning** defines if scanning groups are rows/columns or one half of existing elements:
    * **binary** (checked): groups are built by separating remaining elements in two halves each scanning step <div style="margin-left: 2em"><img src="img/scanning_binary.gif" alt="binary scanning" width="130"/></div>
    * **horizontal** (unchecked): groups are built row/column by row/column <div style="margin-left: 2em"><img src="img/scanning_non_binary.gif" alt="non-binary scanning" width="130" style="margin-left: 2em"/></div>
1. **Scanning Time**: time to wait between two scanning steps (in milliseconds)
1. **Time factor first element**: the time to keep the first scanning group (e.g. first row/column) highlighted is "Scanning Time" multiplied with this factor. Increasing the time for the first group often improves usability.
1. **Scanning keyboard key**: defines which key of the keyboard is used to select the currently highlighted scanning group (default: Space). To change press "Record other key" and press the desired key afterwards.
1. **Scanning ARE events**: makes it possible to select the current scanning group by any event from the [AsTeRICS Framework](01_terms.md#asterics-framework). Set it up this way:
    * Start the AsTeRICS Framework (ARE) with the desired model (e.g. a model generating an event when moving the head)
    * Click on "Record ARE Events" in AsTeRICS Grid
    * Trigger the desired event in the running model (AsTeRICS Framework), e.g. move the head
    * recored events are now listed in the AsTeRICS Grid input configuration, press OK in order to apply the changes
    * Scanning groups now can be selected by triggering the recorded event in the AsTeRICS Framework (e.g. moving the head)
    
[&#x2190; Previous Chapter](03_appearance_layout.md) [Next Chapter &#x2192;](04_input_options.md)

[Back to Overview](00_index.md)