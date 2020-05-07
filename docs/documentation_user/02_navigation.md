# Navigation and basic functionality

This chapter is about general appearance, navigation and basic functionality of the different views in AsTeRICS Grid:

1. [Welcome view](02_navigation.md#welcome-view): intial view shown at first usage
1. [Main view](02_navigation.md#main-view): starting view showing the recently used grid and navigation
1. [Edit view](02_navigation.md#edit-view): view that allows modification of a grid
1. [Manage grids view](02_navigation.md#manage-grids-view): show all grids, create new ones, create a backup
1. [Manage dictionaries view](02_navigation.md#manage-dictionaries-view): show, edit and create new dictionaries
1. [Change user view](02_navigation.md#change-user-view): switch users or login an existing one

[Back to Overview](README.md)

## Welcome view
**Video on YouTube:** [First Start](https://www.youtube.com/watch?v=5ffLB4a9APc&list=PL0UXHkT03dGrIHldlEKR0ZWfNMkShuTNz&index=2&t=0s) (German, but auto-translated subtitles available)

AsTeRICS Grid initially starts with a welcome view giving the choice between:

1. **Use AsTeRICS Grid without registration:** choose this option in order to create a local default user and directly start using AsTeRICS Grid.
1. **Register now:** choose this option in order to sign up for an online user, which makes it possible to synchronize the grids across devices.

See [Terms](01_terms.md#User) for more information about offline/online users.

## Main view
**Videos on YouTube:** [Demo configuration](https://www.youtube.com/watch?v=OU4sI2UcNUo&list=PL0UXHkT03dGrIHldlEKR0ZWfNMkShuTNz&index=3&t=0s), [Fullscreen and lock mode](https://www.youtube.com/watch?v=CK8Lv2bVr-g&list=PL0UXHkT03dGrIHldlEKR0ZWfNMkShuTNz&index=4&t=0s) (German, but auto-translated subtitles available)

Once taken a decision in the welcome view AsTeRICS Grid subsequently starts in the "main view" which looks like Figure 1 (desktop view on the left, mobile view on the right):

![main view](./img/main_en.jpg)
*Fig. 1: Main view*

The elements have this functionality:

1. Open or close the left navigation sidebar
1. **Main**: navigate to the main view (currently shown)
1. **[Manage grids](02_navigation.md#manage-grids-view)**: show all grids of the current user, add new ones or backup them to a file
1. **[Manage dictionaries](02_navigation.md#manage-dictionaries-view)**: show all saved dictionaries, edit them or add new ones
1. **[Change user](02_navigation.md#change-user-view)**: switch between saved users or log in an existing online user
1. **Add online user**: register a new online user (synchronized across devices), see [Users](06_users.md)
1. **Add offline users**: add a new offline user (only for this device)
1. **About AsTeRICS Grid**: Show general information, links, contact address
1. **[Input options](04_input_options.md)**: Options about how to select grid elements (e.g. click, hover, scanning)
1. **[Edit grid](02_navigation.md#edit-view)**: edit the layout of the grid, add new elements, actions for grid elements
1. **Fullscreen**: hide the sidebar and the bar on the top, only showing the current grid (Fig. 1, number 13)
1. **Lock**: lock the screen in order to prevent unintended input or changes beside using and navigating the grid (Fig. 1, number 13)
1. **Grid**: demo grid consisting of 6 grid elements which are navigating to other grids if selected

## Edit view
**Video on YouTube:** [Add and edit elements](https://www.youtube.com/watch?v=KWwWgCgidXM&list=PL0UXHkT03dGrIHldlEKR0ZWfNMkShuTNz&index=13&t=0s) (German, but auto-translated subtitles available)

Clicking on Button "Edit" (Fig. 1, number 9) opens the edit view where a grid can be adapted, see Figure 2:

![edit view](./img/edit_en.jpg)
*Fig.2: Edit view*

The following elements are available in the edit view:

1. Open or close the navigation sidebar
1. **Back**: navigate back to last view (either main view, or manage grids view)
1. **Undo**: reverts the last action
1. **Redo**: redoes the last action after reverting it
1. **More**: opens a menu with additional actions, e.g adding new elements
1. **Edit area**: Grid elements can be repositioned by dragging them (drap & drop). On the right bottom corner it's possible to resize a grid element.
1. **Right click on a grid element**: opens a menu for editing the element (open it with long tap on a mobile device/touchscreen)

See page [Edit grid appearance and layout](03_appearance_layout.md) for more details about editing a grid.

## Manage grids view
**Video on YouTube:** [Manage grids](https://www.youtube.com/watch?v=HQTgvv1Dnn0&list=PL0UXHkT03dGrIHldlEKR0ZWfNMkShuTNz&index=15&t=0s) (German, but auto-translated subtitles available)

The manage grids view provides an overview about the current grids of a user, see Figure 2:

![manage grids view](./img/manage_grids_en.jpg)
*Fig.3: Manage grids view*

The following elements are available in the manage grids view:

1. Open or close the navigation sidebar
1. **Search bar**: filter the listed grids by entering a part of a grid name
1. **New grid**: add a new, empty grid
1. **More**: shows menu with additional actions, e.g. backup the grids to file
1. **Activate global Grid**: activates or deactivates the [global grid](02_navigation.md#global-grid)
1. **Edit global Grid**: opens the edit view for the global grid
1. **Reset global Grid to default**: resets the global grid to default, a row with the following grid elements: "Start", "Back", text entry field, "Delete Word", "Clear" .
1. **Show**: open this grid in main view
1. **Edit**: open this grid in edit view
1. **Clone**: duplicate this grid, creating a copy of it with a different name
1. **Delete**: deletes the grid
1. **Export**:  saves and downloads the specific grid to a .grd file creating a backup of it (saves only this single grid, see "More" menu below to backup all grids)

### Additional options

Clicking on Button "More" (Fig. 3, number 4) opens menu with additional options:

![manage grids more menu](./img/manage_grids_more_en.jpg)

These are the possible options:

1. **New grid**: creates a new and empty grid, same as Fig. 3, number 3
1. **Export backup to file**: creates and downloads a `.grd` file containing a backup of all current grids, dictionaries and input configuration
1. **Import grid(s) from file**: imports one or more grids from a `.grd`, `.obf` or `.obz` file in addition to currently existing grids. Does not import dictionaries or input configuration.
1. **Clear and import from file**: deletes all current grids and imports one or more grids from a `.grd`, `.obf` or `.obz` file. Also imports and replaces dictionaries and overwrites current input configuration if this information is present in the imported `.grd` file.
1. **Reset to default configuration**: deletes all current grids and replaces them with the default demo configuration

**Info about Open Board Format (OBF)**: OBF is an open format for exchanging grids across different AAC tools and is specified on the [official website](https://www.openboardformat.org/). AsTeRICS Grid supports importing OBF files (`.obf` and `.obz`) using the options *Import grid(s) from file* or *Clear and import from file*.

**Video on YouTube:** [Complex grids and OBF](https://www.youtube.com/watch?v=Tpez_-4ILRA&list=PL0UXHkT03dGrIHldlEKR0ZWfNMkShuTNz&index=26&t=0s) (German, but auto-translated subtitles available)

### Global grid
**Video on YouTube:** [Global Grid](https://www.youtube.com/watch?v=bbmMODbqbhk&list=PL0UXHkT03dGrIHldlEKR0ZWfNMkShuTNz&index=25&t=0s) (German, but auto-translated subtitles available)

A global grid is a grid that is visible on every grid page. It may contain general elements that make sense within every grid like e.g. a "Home" grid element that navigates to the start page. A global grid could also contain some kind of core vocabulary that should be visible any time. The following image shows a global grid in action in addition to the "CommuniKate 20" board set from [openboardformat.org](https://www.openboardformat.org/examples):

![manage grids view](./img/global-grid-communikate20.png)

All lightblue elements on top and on the left are elements contained within the global grid. They are visible on every grid page. The global grid can be activated/deactivated and edited in the "Manage Grids" view (see Fig. 3).

## Manage dictionaries view
**Video on YouTube:** [Manage dictionaries](https://www.youtube.com/watch?v=DS9om8MDEDY&list=PL0UXHkT03dGrIHldlEKR0ZWfNMkShuTNz&index=19&t=0s) (German, but auto-translated subtitles available)

In the manage dictionaries view currently saved dictionaries that are used for filling prediction elements (see [Terms](01_terms.md#grid-element)) can be shown and adapted (Figure 4):

![manage dictionaries view](./img/manage_dict_en.jpg)
*Fig. 4: Manage dictionaries view*

The following elements are available in the manage dictionaries view:

1. Open or close the navigation sidebar
1. **New dictionary**: add a new, empty dictionary
1. **Edit dictionary name**: change the name of a dictionary
1. **Edit**: show, edit and add new words to the dictionary
1. **Clone**: create a copy of the dictionary
1. **Delete**: removes the dictionary

For more information about using dictionaries see [Dictionaries](07_dictionaries.md).

## Change user view
**Video on YouTube:** [Offline and online users](https://www.youtube.com/watch?v=CoRUQJJnYaY&list=PL0UXHkT03dGrIHldlEKR0ZWfNMkShuTNz&index=16&t=0s) (German, but auto-translated subtitles available)

In the change user view it's possible to switch between users or login a existing one (Figure 5):

![change user view](./img/login_en.jpg)
*Fig. 5: Change user view*

The following elements are available in the change users view:

1. Open or close the navigation sidebar
1. **Active offline user**: the currently active user is recognizable by a black user symbol and the word "active" next to the username. The active user is the user whose grids and configuration are currently used and shown in all other views. 
1. **Inactive online user**: The little cloud symbol indicates an online user (see [Terms](01_terms.md#user)) and the gray user symbol that he is currently inactive, meaning that the user's grids are currently not used.
1. **Inactive offline user**: The gray user symbol without a cloud indicates an inactive offline user (see [Terms](01_terms.md#user))
1. **Open**: sets the user "active" and opens the main view, showing the user's grid(s). Sets all other users inactive, there is always only one active user.
1. **Delete**: deletes the user and all of his grids and configuration. Use with caution, this action cannot be undone. This option is only available for offline users.
1. **Logout**: deletes the user and all of his grids and configuration, but only on the current device. Data in the cloud and on other devices that are logged in with the same user will not be deleted. This option is only available for online users.
1. **Login with other user**: put in username and password of an existing online user in order to add it to the current device. In order to create a new online or offline user, follow one of the links below.
1. **Remember checkbox**: if checked, the newly logged in online user will be saved to the device and listed in the list of users in the current user view. If unchecked the user will only be opened temporarily and no user data will be saved on the device (recommended for logging in on foreign devices).

For information about offline or online users and how to add them see [Users](06_users.md).

[&#x2190; Previous Chapter](01_terms.md) [Next Chapter &#x2192;](03_appearance_layout.md)

[Back to Overview](README.md)



