# Editing a Grid Element

This chapter explains how to change the appearance of a grid and details on various grid types.

- [Normal Grid Elements](06_editing-grid.md#normal-grid-elements)
- [Collect Elements](06_editing-grid.md#collect-elements)
- [Prediction Elements](06_editing-grid.md#prediction-elements)
- [Youtube Player](06_editing-grid.md#youtube-player)

[Back to Overview](README.md)

## Normal Grid Elements

This chapter is about a grid element's layout and appearance and how to edit it.

### Options in "Main view"

By clicking on 'more -> selected element' in the right upper corner after selecting an element, options for the element appear. These also appear after a right click (or long tap) on a grid element in `edit view` ("editing on"):

![edit view - element menu](./img/edit_moremenu_en.jpg)

*Figure 1: Grid element menu in "Editing on" - view*

These are the options to select:

1. **Edit**: opens a dialog to edit the settings of this element ("Edit grid element" modal). If no element is selected a **New Element** option is available instead ("New grid element" modal).
2. **Delete**: deletes this element
3. **Clone**: inserts a copy of this element to the grid
4. **Copy**: copy the element 
5. **Cut**: cut the element
6. **Paste**: paste the element
7. **Set navigation**: link the element to an existing or a new grid
8. **Move element to other grid**: moves the element to another grid which can be selected
9. **Do element action**: performs the actions that are assigned to this grid element, e.g. speaking the label or navigating to another grid

Cut / Copy / Paste also works across users and browsers on the same device

### Options in "Edit/New grid element" modal

The "Edit"/"New"-modal has four tabs (General, Image, Word Forms and Actions):

##### Tab "General"

Clicking on "Edit" in the grid element menu (Figure 2) opens the following modal (Tab *General*) shown in Figure 2:

![edit grid element general](./img/edit_grid_element_general_en.jpg)
*Figure 2: "Edit grid item" modal - Tab "General"*

These are the elements in the modal of Figure 3 (Edit grid item - Tab *General*):

1. **Label**: change the label of the element shown under the image, can be empty
2. **Color category**: choose the color category (Noun, Verb, etc.)
3. **Search for images**: change to the *Image*-Tab. 
4. **Background / border color**: choose a different backgroud color
5. **Hide element**: the element will only be visible in the "Editing on"-view. After clicking "Editing off", it will not be visible.
6. **Cancel**: discard all changes and close the modal
7. **OK**: save all changes and close the modal
8. **OK, edit previous**: save all changes, edit the previous grid element in the "Edit grid item" modal - Tab "General"
9. **OK, edit next**: save all changes, edit the next grid element in the "Edit grid item" modal - Tab "General"
**Toggle in collection element if added multiple times**: Show/delete element in collect element each time the button is clicked.
You can also set the font size and font.

##### Tab "Image"

![edit grid element image](./img/edit_grid_element_image_en.jpg)
*Figure 3: "Edit grid item" modal - Tab "Image"*

1. **Choose file**: opens a file dialog to choose a different image
2. **Search by label**: image search is done by label
3. **Clear image**: deletes the currently chosen image
4. **Drop area**: drag and drop image files in this area to select them. It's possible to drag and drop files from a file explorer or also other programs
5. **Image Search**: type in the name of which images shall be looked for
6. **Search Provider**: select the provider for the image search
7. **Settings for image search**: select additional settings like Plural or Color (skin color, hair color,...)

##### Tab "Word Forms"

The tab `Word forms` allows to define and edit word forms. For a detailed explanation of the word forms, go to [chapter 12](12_word-forms.md).

##### Tab "Actions"

The *Actions* Tab opens the following configuration modal (Figure 6):

![edit grid element actions](./img/edit_grid_element_actions_en.jpg)

*Figure 6: Edit Actions modal*

This modal configures the actions that will be performed if the grid element is selected. These are the elements in the action modal:

1. **New action**: select a new action to the grid, in the dropdown the action type has to be selected
2. **Add action**: adds the selected action type as a new action to the grid
3. **Current actions**: list of currently configured actions that will be performed if the grid element is selected
4. **Edit**: edit and configure the particular action
5. **Delete**: delete the action from this grid element
6. **Test**: tests the action, e.g. speaks the label. This button is not available for all types of actions.
7. **Cancel**: discard any changes and close the modal
8. **OK**: save all changes and close the modal
9. **OK, edit previous**: save all changes and edit the actions of the previous element
10. **OK, edit next**: save all changes and edit the actions of the next element

[Chapter 08](08_actions.md) provides a detailed explanation of the actions.

## Collect Elements

For collect elements you have the following options:

In the **general** tab you set:
- **Collect Mode**: 
   - **Always Collect Separate Elements**: For elements with pictograms and labels, show each pictogram and label. For elements with a letter ( = keyboards) show each letter separatedly, e.g. "i" and "s" instead of "is"
   - **Collect Cohesive Text**: For elements with pictogramm and labels collect only the text. For elements with a letter connect the letter to one word.
   - **Automatic**: Recognize automatically what is needed.
- **Height of collected images [%]**: Decide how big images should be in comparison to the label.
- **Factor for font size of only-text elements in separated mode**: Controls font size in the collect element if both text and images are collected. Bigger numbers make text-only fonts bigger than text-and-images-font.
- You can further decide whether you want to show the full labels of the images, use a horizontal scrollbar and convert uppercase keyboard letters to lowercase.

In the `Actions` tab you can set more settings for the element with the `Collect element action` (see [chapter 8](08_actions.md#collect-element-action)

## Prediction Elements

For prediction elements, the primary action needed besides `speak label` is `fill prediction elements` which is explained in the [actions](08_actions.md#fill-prediction-elements)

## YouTube Player

Under `General` you can decide if clicking on the youtube player should be allowed. Within the `actions` you can use [YouTube Action](08_actions.md#youtube-action) to navigate youtube directly or else delete that action and set up separate elements to navigate the YouTube player.

[Back to Overview](README.md)
