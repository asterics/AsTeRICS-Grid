# Translation of AsTeRICS Grid

AsTeRICS Grid supports multiple languages. In general there are two things that can be translated:
* **Application language:** the language of the user interface, e.g. labels of buttons or texts within the menus.
* **Grid content language:** the language of the grids, i.e. texts within grid elements or spoken custom texts.

In the Settings menu it's possible to change these languages:
<div><img src="https://github.com/asterics/AsTeRICS-Grid/assets/2537025/bf4acae1-9612-44a2-b3e2-83dc64b9bc00" width="650"/></div>

The grid content language can also be changed via an action attached to a grid element.

We are thankful for any support translating the application of the grid contents!

## Translation of the application
The application can be translated via the online service crowdin, see: [AsTeRICS Grid on crowdin](https://crowdin.com/project/asterics-grid). In order to contribute translations on this platform, follow these steps:
* Create a user/log in at crowdin
* Select the language where you want to contribute and click on "Translate all":
  <img src="https://user-images.githubusercontent.com/328325/188637877-e8dce701-189f-4434-a1ae-fefd210cbb36.png" width="650"/>
* In a stepwise process, translate all the captions, messages and menu items (you may use suggested words and phrases by crowdin which makes the job much easier)
* Translations are automatically transferred to the application and are released at some time (this can take a while)

## Translation of the content
AsTeRICS Grid can offer multilingual as well as monolingual standard gridsets (templates that can be imported). These templates can be imported after creating a new user or using AsTeRICS Grid the first time, for instance:
* **AsTeRICS Grid default (multilingual):** is a default gridset created by UAS Technikum Wien which is a demo for many possibilities that AsTeRICS Grid offers. It's one configuration which is translated to many languages. This means that the language can be switched by the user, since all translations are included within this configuration.
* **Global-Core Communicator ARASAAC**: is a communicator that is offered monolingual. This means that the configuration only contains one language and it's not possible to switch the language within this configuration. However it's still possible to translate the configuration and make it available in a separate monolingual configuration.

In general multilingual and monolingual gridsets are appropriate in different use cases:
* **Multilingual**: use cases where users should to be able to switch languages, e.g. a configuration used in a hospital which is used by different users speaking different languages.
* **Monolingual**: if a configuration is used by a single user speaking only one language, a monolingual configuration suits better. It also has the advantage that the structure of the grids (e.g. a keyboard grid) can be adapted to best fit a single language, which can be difficult for multilingual configurations.

### Translation of a multilingual default gridset
Follow these steps to translate an existing multilingual default gridset (e.g. `AsTeRICS Grid default`):
* Create a new offline user with any username
* Import the default gridset you want to translate
* Use `Editing on -> More (right top corner) -> Translate grid` to translate all grids to the target language
* **Hint**: you can select `show all grids` and use the buttons `Copy column` and `Paste column` to copy/paste elements from/to a translation service like Google tranlsate. This can greatly speed up the translation process. <div><img src="https://github.com/asterics/AsTeRICS-Grid/assets/2537025/3962002b-c737-4a3f-b55c-116a20197d31" width="650"/></div>
* **Important**: don't change anything else in the configuration (e.g. adding new grid elements)
* Create a backup with the new language via `Manage grids -> More (right top corner) -> Save backup to file`
* Send the file to [office@asterics-foundation.org](mailto:office@asterics-foundation.org) and we can add this translation to the default gridset! Alternatively you can also [directly create a Pull Request at AsTeRICS Grid Boards](https://github.com/asterics/AsTeRICS-Grid-Boards?tab=readme-ov-file#update-the-contents-of-the-boards-of-existing-configuration).

### Creation of a new monolingual default gridset
If you want to create a new default gridset for a single language, follow these steps:
* Create a new offline user with any username
* Import an existing default gridset if you want to build upon it or start with an empty configuration if you want to build something new
* Set the correct content language under "Settings":
  <img src="https://user-images.githubusercontent.com/328325/188639307-88ee550d-a0aa-433f-9c2e-de2748f6734c.png" width="650"/>
* Translate the gridset or adjust configuration as you like and how it works best for the desired language. This can also be something completely different than the base gridset.
* Export the finished configuration using `Manage grids -> More (right top corner) -> Save custom data to file` and there select these options:
   * Export `All grids`
   * Select `Export only current content language`
   * Uncheck `Export dictionaries`
   * Check `Export global grid`
  <div><img src="https://github.com/asterics/AsTeRICS-Grid/assets/2537025/580ada47-e78c-4fba-929f-e3fd2d09e2cc" width="650"/></div>
* Send the file to [office@asterics-foundation.org](mailto:office@asterics-foundation.org) and we can offer it as new default gridset! Alternatively you can also [directly create a Pull Request at AsTeRICS Grid Boards](https://github.com/asterics/AsTeRICS-Grid-Boards?tab=readme-ov-file#add-translated-version-of-monolingual-configuration).

You can also watch the [video tutorial about gridset translation](https://www.youtube.com/watch?v=QPqZlTSMR8U)
(use auto-translation of subtitles, as this is a german video!)
