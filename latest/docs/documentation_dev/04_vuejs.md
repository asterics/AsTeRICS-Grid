# Vue.js
This chapter is about [Vue.js](https://vuejs.org/), the single-page application framework used for AsTeRICS Grid.

1. [General](04_vuejs.md#general)
1. [Component structure](04_vuejs.md#component-structure)
1. [Used components](04_vuejs.md#used-components)

[Back to Overview](README.md)

## General
In AsTeRICS Grid [Vue.js](https://vuejs.org/) is used in order to manage views and it's elements in components and to create all kinds of interactivity in the UI. In Vue.js components can be organized in single `.vue` files, containing the HTML, Javascript and CSS needed for this component. These files are called single-file-components (SFC). These are the files and folders that are important regarding the usage of Vue.js:

* **[src/vue-components](https://github.com/asterics/AsTeRICS-Grid/tree/master/src/vue-components)**: contains all Vue.js single-file components (`.vue` files)
* **[index.html](https://github.com/asterics/AsTeRICS-Grid/blob/master/index.html)**: contains the HTML for the main Vue wrapper component consisting of the navigation sidebar and a placeholder for the currently show view
* **[src/js/vue/mainVue.js](https://github.com/asterics/AsTeRICS-Grid/blob/master/src/js/vue/mainVue.js)**: Javascript part for the main Vue component in `index.html`
* **[src/js/vue/vuePluginManager.js](https://github.com/asterics/AsTeRICS-Grid/blob/master/src/js/vue/vuePluginManager.js)**: defines custom Vue directives and filters that can be used globally, e.g. a [translate filter](07_i18n.md#vuejs-filter).

## Component structure
The main Vue wrapper component is defined in [index.html](https://github.com/asterics/AsTeRICS-Grid/blob/master/index.html) and [mainVue.js](https://github.com/asterics/AsTeRICS-Grid/blob/master/src/js/vue/mainVue.js). This line in `index.html` is a placeholder for the currently shown view of the application:
```
<component v-if="component" v-bind:is="component" v-bind="properties" :key="componentKey"></component>
```

The method [MainVue.setViewComponent()](https://github.com/asterics/AsTeRICS-Grid/blob/master/src/js/vue/mainVue.js) is used in order to change the currently shown view. This method is primarily used by [router.js](https://github.com/asterics/AsTeRICS-Grid/blob/master/src/js/router.js) which chooses the correct view based on the current [URL hash](https://en.wikipedia.org/wiki/Fragment_identifier) in the address. For instance `https://grid.asterics.eu/#grids` has the hash `#grids` and therefore will render the [manage grids](../documentation_user/02_navigation.md#manage-grids-view) component which is defined in file [manageGridsView.vue](https://github.com/asterics/AsTeRICS-Grid/blob/master/src/vue-components/views/manageGridsView.vue).

Figure 1 highlights the Vue.js components that are used for the main view:

![](./img/main.png)
*Fig. 1: Vue component structure of the main view, red part (right) is replaced depending on the current navigation*

## Used components
The used Vue components can be found in the folder [src/vue-components](https://github.com/asterics/AsTeRICS-Grid/tree/master/src/vue-components) which contains the following folders:
* **components**: generic components that can be used in various places across the application, for instance:
    * **accordion.vue**: accordion component showing some collapsable content
    * **comparisonComponent.vue**: accordion component showing a comparison between online and offline users (information only)
    * **headerIcon.vue**: component used in the header of different views which shows a hamburger menu and the AsTeRICS Grid logo
    * **inputEventList.vue**: subcomponent for input options, see folder `vue-components/modals/input`.
    * **media-list.vue**: a generic list of media elements, used for web-radios and podcasts
    * **nav-tabs.vue**: a generic component for navigation tabs, used in modal for editing elements and in settings
    * **notificationBar.vue**: notification bubble at the bottom right, used for app notifications
    * **searchBar.vue**: generic search bar, used in various places
* **grid-display**: components that use components of library `vue-css-grid-layout` for the context of AsTeRICS Grid:
  * **appGridDisplay.vue**: component representing a whole grid containing several elements
  * **appGridElement.vue**: component representing a generic single grid element
  * **grid-elements**: folder containing components for all types of elements, e.g. normal elements, collect elements, live elements, etc. Also see [Element types in "Terms"](../documentation_user/01_terms.md#grid-element).
* **grid-layout**: components of library `vue-css-grid-layout`, see [last chapter about Grid layout](./03_grid.md)
* **modals**: contains all kinds of modals (popup dialogs), for instance:
    * **editElement.vue**: modal for editing a grid element. The files `editElement[TAB].vue` are subcomponents for the tabs in the edit modal, e.g. `editElementActions.vue`.
    * **addMultipleModal.vue**: modal for importing multiple new grid elements at once, used in [edit view](../documentation_user/06_editing-grid.md)
    * **importDictionaryModal.vue**: modal for importing new words to a dictionary, see chapter [Dictionaries](../documentation_user/10_dictionaries.md#add-words) in user documentation
    * **input**: folder for all modals about input options, see chapter [Input Options](../documentation_user/09_input-options.md) in user documentation
* **views**: contains different views which are rendered into the component placeholder described in [component structure](04_vuejs.md#component-structure):
    * **aboutView.vue**: view containing general information about AsTeRICS Grid
    * **addOfflineView.vue**: see [Offline users](../documentation_user/03_basic_setup.md#offline-users)
    * **dictionariesView.vue**: see [Manage dictionaries view](../documentation_user/10_dictionaries.md)
    * **gridEditView.vue**: see [Edit view](../documentation_user/06_editing-grid.md)
    * **gridView.vue**: see [Main view](../documentation_user/04_navigation-overview.md)
    * **loginView.vue**: see [Change user view](../documentation_user/04_navigation-overview.md#change-user)
    * **manageGridsView.vue**: see [Manage grids view](../documentation_user/05_editing-grid-set.md)
    * **registerView.vue**: see [Online users](../documentation_user/03_basic_setup.md#online-users)
    * **welcomeView.vue**: see [](../documentation_user/03_basic_setup.md#welcome-view)
    
For general information about the structure and usage of Vue.js components, see the official documentation, for instance [Component Basics](https://vuejs.org/v2/guide/components.html).

[&#x2190; Previous Chapter](03_grid.md) [Next Chapter &#x2192;](05_datamodel.md)

[Back to Overview](README.md)



