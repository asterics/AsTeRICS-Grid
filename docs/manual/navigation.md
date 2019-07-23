# Navigation

This chapter is about general appearance and navigation in AsTeRICS Grid,

[Back to Overview](index.md)

## Welcome view
AsTeRICS Grid initially starts with a welcome view giving the choice between:

1. **Use AsTeRICS Grid without registration:** choose this option in order to create a local default user and directly start using AsTeRICS Grid.
1. **Register now:** choose this option in order to sign up for an online user, which makes it possible to synchronize the grids across devices.

See [Terms](terms.md#User) for more information about offline/online users.

## Main view
Once taken a decision in the welcome view AsTeRICS Grid subsequently starts in the "main view" which looks like this (desktop view on the left, mobile view on the right):

![main view](img/main_en.jpg)

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
1. **Fullscreen**: hide the sidebar and the bar on the top, only showing the current grid (13)
1. **Lock**: lock the screen in order to prevent unintended input or changes beside using an navigating the grid (13)
1. **Grid**: demo grid consisting of 6 grid elements, navigating to other grids if selected

## Input Options
Clicking on Button "Input Options" (9) opens a modal where input modalities can be configured:

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

1. **Binary scanning**: defines if scanning groups are rows/columns or one half of existing elements:
    * **binary** (checked): groups are built by separating remaining elements in two halves each scanning step <div style="margin-left: 2em"><img src="img/scanning_binary.gif" alt="binary scanning" width="130"/></div>
    * **horizontal** (unchecked): groups are built horizontal, moving top to bottom <div style="margin-left: 2em"><img src="img/scanning_non_binary.gif" alt="non-binary scanning" width="130" style="margin-left: 2em"/></div>



[&#x2190; Previous Chapter](terms.md) [Next Chapter &#x2192;](appearance_layout.md)

[Back to Overview](index.md)



