# Dictionaries

[Back to Overview](README.md)

This chapter is about dictionaries and how to manage and use them within AsTeRICS Grid.
A dictionary is a collection of words and their relations that is saved within AsTeRICS Grid in order to fill [prediction elements](01_terms.md#grid-element). 

In the manage dictionaries view, currently saved dictionaries that are used for filling prediction elements (see [Terms](01_terms.md#grid-element)) can be shown and adapted (Figure 1):

![manage dictionaries view](./img/manage_dict_en.jpg)
*Figure 1: "Manage dictionaries" - view (desktop view on the left, mobile view on the right)*

The following elements are available in the manage dictionaries view:

1. Open or close the navigation sidebar
2. **Import dictionary**: imports a dictionary from online dictionaries or from a `.json` file
3. **New empty dictionary**: add a new, empty dictionary
4. **Edit**: show, edit and add new words to the dictionary
5. **Clone**: create a copy of the dictionary
6. **Delete**: removes the dictionary
7. **Save**: saves the dictionary as `.json` file
8. **Edit dictionary name**: change the name of a dictionary

## Edit dictionaries

In the manage dictionaries view clicking on "Edit" in the list of dictionaries allows to see the details of a dictionary and editing it:

![edit a dictionary](./img/dictionary_edit_en.jpg)
*Figure 2: Edit a dictionary*

Typing a word or a part of it in the search field filters the list of shown words. Clicking on the recycle bin symbol next to a word deletes it from the dictionary.

### Add words

Clicking on the "Import words" in Figure 2 button opens a modal:

![import words to dictionary](./img/dictionary_import_en.jpg)
*Figure 3: Import words modal*

These are the elements of the "import words" modal:

1. **Advanced options**: click to toggle visibility of advanced import options (Figure 3, advanced options are shown on the left, hidden on the right)
2. **Input field**: field to input or paste words that should be imported to the dictionary 
3. **Recognized words**: live-updated list of recognized words based on the input options and words typed into the textfield 
4. **Cancel**: discard changes and close the modal 
5. **Insert words**: import the recognized words to the dictionary and close the modal 
6. **Element separator**: separator between words to recognize, can be either a single character or <a href="https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/RegExp" target="_blank">Javascript RegExp syntax</a>. Default value is the Javascript RegExp `[\n; ]` meaning that line breaks, semicolons and spaces can be used to divide words.
7. **In-element separator** (optional): single character or Javascript RegExp expression that re-splits elements that are recognized by "element separator". This is needed if the imported data consists of words and and a rank specifying the position of the word based on it's frequency.
8. **Word index**: if "in-element separator" is set this property specifies the position of the word 
9. **Rank index**: if "in-element separator" is set this property specifies the position of the rank 

#### Example: import a big word list

This example shows how to import a big list of words, for instance a list of the <a href="http://corpus.leeds.ac.uk/frqc/internet-en-forms.num" target="_blank">most frequent 25000 words</a> from <a href="http://corpus.leeds.ac.uk/" target="_blank">Corpus leeds</a>. 

The format of the list looks like this:

```
1 43116.72 the
2 25428.07 of
3 22833.85 to
...
```

Each data record has the format `<rank> <frequency> <word>` and is separated by a line separator `\n`. In order to import this list to AsTeRICS Grid the whole list has to be copied, inserted into the text field of the import modal (Figure 3, number 2) and the following advanced options have to be set (Figure 3, number 6-9):

* **Element separator**: `\n` - since the data records are separated by line breaks
* **In-element separator**: `[ ]` (space) - since the data inside the lines is separated by spaces
* **Word index**: `2` - since the word is the third element within a data record (zero-based index)
* **Rank index**: `0` - since the rank is the first element within a data record (zero-based index)

[Back to Overview](README.md)
