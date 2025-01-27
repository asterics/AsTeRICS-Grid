# Terms

This chapter explains the most important terms used in relation to the AsTeRICS Grid.

[Back to Overview](README.md)

## AsTeRICS Grid
Web-based application for AAC solutions, runs in the browser (e.g. Firefox, Chrome, Edge, Internet Explorer, mobile Browsers).

## AsTeRICS Framework
Java-based software suite that runs on a computer and makes it possible to trigger additional actions using the AsTeRICS Grid, e.g. controlling a TV (environmental control). See [AsTeRICS Framework](https://www.asterics.eu/get-started/) on the web.

## AsTeRICS model
An AsTeRICS model is a configuration for the AsTeRICS Framework which realizes a certain use-case, e.g. environmental control, camera based head-tracking or eye-tracking. A model that runs in the AsTeRICS Framework can interact with the AsTeRICS Grid.

## Grid
Term for a single page in the AsTeRICS Grid, consisting of several grid elements. The number of elements a grid contains is flexible.

## Grid element
A grid element is part of a grid and normally consists of a label and/or an image. Selecting a grid element normally triggers an action, e.g. navigating to another grid.

There are 3 types of grid elements:

1. **Normal**: an element consisting of a label and/or an image
1. **Collect element**: an element that collects the labels of previously selected elements and therefore makes it possible to construct e.g. sentences out of single word elements.
1. **Prediction element**: an element that is dynamically filled up with word predictions based on previously selected normal elements.

## Action
An action that is performed if a grid element is selected, e.g. navigate to another grid, speak some text or some external action like turning on a light. See [Grid element actions](05_actions.md).

## Input
In the context of AsTeRICS Grid "input" refers to the mean of selecting a grid element. This can be e.g. a normal mouse click, hovering or scanning. See [Input options](04_input_options.md).

## Dictionary
A dictionary is a set of words that is used to fill up prediction grid elements. By default a dictionary including the most frequent english/german words is used, but also custom dictionaries can be used. See [Dictionaries](06_dictionaries.md).

## User
In AsTeRICS Grid a "user" refers to a username and a set of grids, which in sum realize a solution for an actual user. There are two types of users in AsTeRICS Grid:

1. **Offline users**: are users whose grids are only stored locally on the used device.
1. **Online users**: are users whose grids are stored locally on the device and online in the cloud. In contrast to offline users they also have a password that is used to encrypt all grids before saving them online.

For more information see [Users](06_users.md).

[Next Chapter &#x2192;](02_navigation.md)

[Back to Overview](README.md)



