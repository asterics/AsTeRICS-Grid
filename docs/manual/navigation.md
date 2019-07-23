# User interface and navigation

This chapter is about general appearance and navigation in AsTeRICS Grid:

1. [Welcome view](navigation.md#welcome-view): intial view shown at first usage
2. [Main view](navigation.md#main-view): starting view showing the recently used grid and navigation
3. [Input options](navigation.md#input-options): options about how to select grid elements
3. [Edit view](navigation.md#edit-view): view that allows modification of a grid

[Back to Overview](index.md)

## Welcome view
AsTeRICS Grid initially starts with a welcome view giving the choice between:

1. **Use AsTeRICS Grid without registration:** choose this option in order to create a local default user and directly start using AsTeRICS Grid.
1. **Register now:** choose this option in order to sign up for an online user, which makes it possible to synchronize the grids across devices.

See [Terms](terms.md#User) for more information about offline/online users.

## Main view
Once taken a decision in the welcome view AsTeRICS Grid subsequently starts in the "main view" which looks like Figure 1 (desktop view on the left, mobile view on the right):

![main view](img/main_en.jpg)
*Fig. 1: Main view*

The elements have this functionality:

1. Open or close the left navigation sidebar
1. **Main**: navigate to the main view (currently shown)
1. **Manage grids**: show all grids of the current user, add new ones or backup them to a file
1. **Manage Dictionaries**: show all saved dictionaries, edit them or add new ones
1. **Change user**: switch between saved users or log in an existing online user
1. **Add online user**: register a new online user (synchronized across devices)
1. **Add offline user**: add a new offline user (only for this device)
1. **About AsTeRICS Grid**: Show general information, links, contact address
1. **Input Options**: Options about how to select grid elements (e.g. click, hover, scanning)
1. **Edit grid**: edit the layout of the grid, add new elements, actions for grid elements
1. **Fullscreen**: hide the sidebar and the bar on the top, only showing the current grid (Fig. 1, number 13)
1. **Lock**: lock the screen in order to prevent unintended input or changes beside using an navigating the grid (Fig. 1, number 13)
1. **Grid**: demo grid consisting of 6 grid elements, navigating to other grids if selected

## Input Options
Clicking on Button "Input Options" (Fig. 1, number 9) opens a modal where input modalities can be configured:

![input options](img/input_options_en.jpg)

These are the possible options:

1. **Enable Scanning**: enables the "scanning" method, which means that grid elements are consecutively highlighted and the user can select the desired element just by a single input channel, e.g. a single keyboard key or a tap anywhere on the touch-screen.
1. **Enable Hovering**: enables the "hovering" input method, which means that grid elements selected by keeping the mouse cursor positioned on an element for a specific amount of time. On a touchscreen it means that elements are selected by tap-and-hold on them for some duration.
1. **Hover Time**: the time in milliseconds to dwell on an element in order to select it (if hovering enabled)
1. **Select with mouse click**: selects an element by just clicking on it (tap on touchscreen)

### Scanning options
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
1. **Scanning ARE events**: makes it possible to select the current scanning group by any event from the [AsTeRICS Framework](terms.md#asterics-framework). Set it up this way:
    * Start the AsTeRICS Framework (ARE) with the desired model (e.g. a model generating an event when moving the head)
    * Click on "Record ARE Events" in AsTeRICS Grid
    * Trigger the desired event in the running model (AsTeRICS Framework), e.g. move the head
    * recored events are now listed in the AsTeRICS Grid input configuration, press OK in order to apply the changes
    * Scanning groups now can be selected by triggering the recorded event in the AsTeRICS Framework (e.g. moving the head)

## Edit view
Clicking on Button "Edit" (Fig. 1, number 9) opens the edit view where a grid can be adapted, see Figure 2:

![edit view](img/edit_en.jpg)
*Fig.2: Edit view*

The following elements are available in the edit view:

1. Open or close the navigation sidebar
1. **Back**: navigate back to last view (either main view, or manage grids view)
1. **Undo**: reverts the last action
1. **Redo**: redoes the last action after reverting it
1. **More**: opens a menu with additional actions, e.g adding new elements
1. **Edit area**: Grid elements can be repositioned by dragging them (drap & drop). On the right bottom corner it's possible to resize a grid element.
1. **Right click on a grid element**: opens a menu for editing the element (open it with long tap on a mobile device/touchscreen)

### Adding elements and layout options
The following menu opens on a click on "More" (Fig. 2, number 5):

![edit view](img/edit_moremenu_en.jpg)

These are the actions to select in the menu:

1. **New &#x2192; New Element**: creates a normal new element, opening a dialog where label and image can be defined
1. **New &#x2192; Many new elements**: creates multiple new normal elements at once, opening a dialog where multiple elements can be defined and inserted into the grid
1. **New &#x2192; New collect element**: creates a new collect element, see [Terms](terms.md#grid-element)
1. **New &#x2192; New prediction element**: creates a new prediction element, see [Terms](terms.md#grid-element)
1. **Delete all elements**: removes all grid elements from the grid
1. **Add row to layout**: adds a new row to the grid layout, e.g. creating a new third row for elements at the bottom in Figure 2 <div style="margin-left: 2em"><img src="img/add_row.gif" alt="add row" width="130" style="margin-left: 2em"/></div>
1. **Remove row from layout**: removes the last row from the grid layout while keeping all grid elements. Applied to Figure 2 this would mean that afterwards there is only a single row where all six elements are placed. <div style="margin-left: 2em"><img src="img/remove_row.gif" alt="remove row" width="130" style="margin-left: 2em"/></div>
1. **Fill gaps**: moves all grid elements as far left as possible, closing gaps. Applied to Figure 2 this would result in moving "Food" to the left, closing the gap between "Food" and "Clothing". <div style="margin-left: 2em"><img src="img/fill_gaps.gif" alt="fill gaps" width="130" style="margin-left: 2em"/></div>


[&#x2190; Previous Chapter](terms.md) [Next Chapter &#x2192;](appearance_layout.md)

[Back to Overview](index.md)



