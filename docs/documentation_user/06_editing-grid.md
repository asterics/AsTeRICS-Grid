# Editing a Grid

This chapter explains how to change the appearance of a grid and details on various grid types.

- [Edit View](06_editing-grid.md#edit-view)
- [Manage Grids View](06_editing-grid.md#manage-grids-view)
- [Global Grid](06_editing-grid.md#global-grid)
- [Home Grid](06_editing-grid.md#home-grid)

[Back to Overview](README.md)

Options for editing a Grid are located under `Main -> editing` and in the `Manage grids` menu. 

## Edit View

In the edit view, the following menu opens on a click on `more`:

![edit view - more menu](./img/edit_moremenu_en.jpg)

*Figure 1: Edit view - menu "more"*

The following actions for editing the grid are available in `more`:

- **Copy all elements**: copies all grid elements from the grid
- **Delete all elements**: removes all grid elements from the grid
- **Layout**: Move all elements up/right/down/left and normalize grid (set all elements to the same grid size and move all elements to the left)
- **Grid settings**: set grid size (number of rows and minimum number of columns) and decide if the global grid should be shown on this specific grid
- **Edit global Grid**: directly go to the page, where the global grid can be edited (otherwise go to `Manage grids → Edit global Grid` (at the bottom))

**Reposition grid elements**: Grid elements can be repositioned by dragging them (drag & drop). Dropping above an existing element exchanges the places. Dropping it between two elements inserts it between these elements. 
On the right bottom corner it's possible to resize a grid element.

## Manage Grids View

The manage grids view provides an overview about the current grids of a user, see Figure 2:

![manage grids view](./img/manage_grids_en.jpg)

*Figure 2: "Manage grids" - view (desktop view on the left, mobile view on the right)*

The following actions for editing the grid are available in the manage grids view:

2. **Name of grid**: type name of the grid and confirm by clicking on the tick
3. **New grid**: add a new, empty grid
4. **more**: shows menu with additional actions, e.g. backup the grids to file or restore backups from file
5. **Show**: open this grid in main view
6. **Edit**: open this grid in edit view
7. **Clone**: duplicate this grid, creating a copy of it with a different name
8. **Delete**: delete this grid
9. **Export**: saves and downloads this specific grid to a `.grd` file creating a backup of it (saves only this single grid, see "More" menu (Number 4) to backup all grids)
10. **Save as PDF**: saves and downloades the grid as PDF
11. **Grids to show**: select which grids shall be shown in the grid list
12. **Sort grids by**: select how the grids in the grid list shall be sorted

### "more" button - Additional options

Clicking on Button "more" (Figure 2, number 4) opens menu with additional options:

![manage grids more menu](./img/manage_grids_more_en.jpg)

*Figure 4: "Manage grids" - view - "more" button*

The following actions for editing the grid are available in the `more` button:
- **New Grid**: creates a new and empty grid, same as Figure 4, number 3
- **Save grids to PDF**: creates and downloads a `.pdf` file of one or all grids, which can be used for later printing


## Global Grid

![global grid](./img/global_grid_empty_en.JPG)

*Figure 5: Global Grid*

All the elements shown here are elements contained within the global grid. They are visible on every grid page.
While editing the global grid it's possible to define its height by opening `More -> Change grid dimensions` and setting the value for `height of first global grid row` and change the grid dimension.


## Home Grid

At the bottom of "Manage grids" it's possible to define a `Home grid`. This grid is automatically opened at startup of AsTeRICS Grid. If no home grid is defined, the last opened grid is opened.

`Navigate to home grid after selecting an element` can be selected in order to automatically navigate to the home grid after any element (which doesn't navigate to an other grid) is selected. This can speed up the construction of sentences in more complex communicator interfaces.

It's possible to define an action that navigates to the home grid, see action ["Navigate to other grid"](08_actions.md#navigate-to-other-grid).

[Back to Overview](README.md)