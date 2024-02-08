# Word forms in AsTeRICS Grid

For simple communication boards it's sufficient to use static labels (in different languages) for grid elements. However, for more advanced communicators including grammar, "word forms" can be used.

## General
Word forms can be defined for each element in the [dialog for editing grid elements](03_appearance_layout.md#editing-grid-elements). The tab `Word forms` allows to define and edit word forms (see Fig.1).

![edit view](./img/word-forms-modal.png)
*Fig.1: Dialog for defining and editing word forms*

The dialog in Figure 1 shows the following options:
1. **Language**: (optional) language of the new word form
2. **Tags**: (optional) tags assigned to the new word form (e.g. `1.PERS` or `PLURAL`)
3. **Word form**: the value of the new word form
4. **Pronunciation**: (optional) alternative pronunciation for the new word form
5. **Add word form**: adds the newly defined word form to the list
6. **Import/export data to/from all grids**: if activated, word forms are not only imported/exported for the current element, but for all elements within all grids. This options helps to quickly edit all word forms (e.g. managed in an external spreadsheet).
7. **Override existing word forms**: if activated, all existing word forms are overwritten by import. Always activated if importing globally.
8. **Import from clipboard**: imports word forms from the clipboard, copied from an external spreadsheet. The columns that can be imported are: `WORD FORM`, `LANG (2 digits)`, `TAGS (comma separated)`, `LABEL`, `PRONUNCIATION`. Order of columns is important, but not all have to be existing, so it's also possible to copy only the first ones.
9. **Copy to clipboard**: copies word forms to the clipboard in a format that can be pasted to a spreadsheet.
10. **Language filter**: dropdown for selecting a language for filtering the list of word forms
11. **Delete all**: deletes all word forms of the current element
12. **Edit button**: enable/disable edit mode for a specific word form in the list
13. **Trash button**: delete a specific word form
14. **Up button**: moves the word form up within the list
15. **Down button**: moves the word form down within the list

## Word form actions
Once word forms are defined for different elements, they can be used and selected using the action type `Change word forms`.