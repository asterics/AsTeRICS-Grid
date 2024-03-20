# Data model
This chapter is about the data model used in AsTeRICS Grid.

1. [Introduction](05_datamodel.md#introduction)
1. [Data models saved to database](05_datamodel.md#data-models-saved-to-database)
1. [Data models not saved to database](05_datamodel.md#data-models-not-saved-to-database)
1. [Common data model properties](05_datamodel.md#common-data-model-properties)
1. [Full and short objects](05_datamodel.md#full-and-short-objects)

[Back to Overview](README.md)

## Introduction
Since Javascript is not a typed language it's not possible by default to define a data model in order to perform checks on valid properties and their types. For this reason the library [ObjectModel](https://objectmodel.js.org/) is used which allows to define data models and perform dynamic checks on their validity. 

## Data models saved to database
Data models defined for AsTeRICS Grid can be found in the folder [src/js/model](https://github.com/asterics/AsTeRICS-Grid/tree/master/src/js/model). These are the used data models which are actually saved to database:

* **GridData**: model for a grid, containing a list of GridElement objects
* **MetaData**: model for global data, including InputConfig and e.g. the ID of the last opened grid to show at startup
* **Dictionary**: saves the configuration of a [predictionary](https://www.npmjs.com/package/predictionary) wordlist, a dictionary shown in the [manage dictionaries view](../documentation_user/02_navigation.md#manage-dictionaries-view)
* **GridImage**: saves the data of an imported image in higher resolution. This is used if a grid element is resized in order to save a new image with fitting size to it's GridElement object.
* **EncryptedObject**: contains any of the data model objects above serialized as JSON object and encrypted using the [sjcl](https://github.com/bitwiseshiftleft/sjcl) crypto library. In fact every object saved to database is an EncryptedObject containing one of the data model objects listed above.

## Data models not saved to database
These are the used data models which part of one of the data models above, but aren't independently saved to database:
* **GridElement**: data model for a single grid element, containing label, image and corresponding GridAction objects 
* **AdditionalGridFile**: generic file that is saved within GridData, e.g. an [AsTeRICS ARE model](../documentation_user/01_terms.md#asterics-model)
* **GridActionARE**: data model for an [asterics action](../documentation_user/05_actions.md#asterics-action)
* **GridActionCollectElement**: data model for a [collect element action](../documentation_user/05_actions.md#collect-element-action)
* **GridActionNavigate**: data model for a [navigate to other grid action](../documentation_user/05_actions.md#navigate-to-other-grid)
* **GridActionPredict**: data model for a [fill prediction elements action](../documentation_user/05_actions.md#fill-prediction-elements)
* **GridActionSpeak**: data model for a [speak label action](../documentation_user/05_actions.md#speak-label)
* **GridActionSpeakCustom**: data model for a [custom speak action](../documentation_user/05_actions.md#speak-custom-text)
* **InputConfig**: part of MetaData, containing all input config options (e.g. scanning, hovering)

## Common data model properties
All data models have these properties in common:

* **id** [String]: unique ID of the object
* **modelName** [String]: name of the data model, same as the class filename defining it, e.g. GridData
* **modelVersion** [String]: version of the data model using semantic versioning, e.g. `1.0.0`

## Full and short objects
EncryptedObject has the following two additional properties:

1. **encryptedDataBase64**: contains the encrypted version of the serialized JSON object this EncryptedObject actually holds
1. **encryptedDataBase64Short**: contains the same encrypted serialized JSON object, but all properties longer than 500 characters are removed. This "short" version of the object can be used if not all data is needed, e.g. no image data of grids, but only short data items like the label. The property `encryptedDataBase64Short` is empty (`null`), if it's the same as `encryptedDataBase64` (no long properties) in order to save memory space.

The `GridData` data model contains a property `isShortVersion` which indicates that the current object includes only a short, stripped version of the data, if set to `true`. These short versions of GridData objects are used for the list of grids in the [manage grids view](../documentation_user/02_navigation.md#manage-grids-view) since there the only properties that are needed are `label` and `id`.

[&#x2190; Previous Chapter](04_vuejs.md) [Next Chapter &#x2192;](06_data_storage.md)

[Back to Overview](README.md)



