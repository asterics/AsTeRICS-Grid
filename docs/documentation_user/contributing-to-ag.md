# Contributing to AsTeRICS Grid

[Back to Overview](README.md)

You can help shape the future of AsTeRICS Grid and ensure it meets the needs of its users. Contribute actively to the development of AsTeRICS Grid by suggesting new features, discussing ideas, and reporting bugs directly on GitHub.

## GitHub
AsTeRICS Grid is free and Open Source and the [source code can be found on GitHub](https://github.com/asterics/AsTeRICS-Grid/).

Terms related to GitHub:
* **Repository**: A repository is the place where all the files for a specific project are stored and where discussion about that specific project takes place.
* **Issue**: An issue is the name for the threads people can create. This can be done to request a feature, report a bug or other "issues".

### Joining GitHub
- **Sign Up on GitHub**: If you don’t already have an account, [sign up for GitHub here](https://github.com/signup). Provide your email address, choose a username, and create a password. Verify your email address by entering the confirmation code sent to your inbox.  
- **Access the AsTeRICS Grid Repository**: Once logged in, open the [AsTeRICS Grid repository](https://github.com/asterics/AsTeRICS-Grid/)
- **Engage with the Repository**: If you’re not a developer, there are two key features relevant to you:  
     - *Stay updated*: Click the *Watch* button (next to the repository name) and select *Custom*. Then, choose *Issues* and *Releases* to receive notifications about new discussions, bug reports, and updates. This way, you’ll stay informed about the latest developments, which are typically released in monthly updates.  
     - *The issues tab*: Click on the [Issues tab](https://github.com/asterics/AsTeRICS-Grid/issues) to view existing feature requests, bug reports, and discussions. You can join ongoing conversations, share your thoughts, or create new issues to suggest features or report problems.

### Participating on GitHub
- **One issue per topic**: Create a separate issue for each suggestion you have. This makes it much easier to keep discussions separated and the organization of the issues clear.
- **Search for open issues**: before creating a new issue, please search for existing open issues about the same topic.
- **Join existing discussions**: If an issue already exists for the feature you want, contribute to the existing discussion. Add a comment expressing your interest in the feature, explaining why it would be valuable to you, or participating in the conversation about how it could be implemented in the app.

## AsTeRICS Grid Community

While GitHub is the place for discussing bugs and new features in detail, the [AsTeRICS Grid Community on Facebook](https://www.facebook.com/groups/1550700782223677) is an open place for discussing anything related to AsTeRICS Grid and sharing your experiences.
Your input is valuable!

## Join As a Programmer

Issues labelled with [good first issue](https://github.com/asterics/AsTeRICS-Grid/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22good%20first%20issue%22) are a good way to get to know the programming. Please also read the [Collaboration guide](../documentation_dev/collaboration.md).

## Translate the Application

**Application language:** the language of the user interface, e.g. labels of buttons or texts within the menus.

The application can be translated via the online service crowdin, see: [AsTeRICS Grid on crowdin](https://crowdin.com/project/asterics-grid). In order to contribute translations on this platform, follow these steps:
* Create a user and log in at crowdin
* Select the language where you want to contribute and click on "Translate all":
  <img src="https://user-images.githubusercontent.com/328325/188637877-e8dce701-189f-4434-a1ae-fefd210cbb36.png" width="650"/>
* In a stepwise process, translate all the captions, messages and menu items (you may use suggested words and phrases by crowdin which makes the job much easier)
* Translations are automatically transferred to the application and are released at some time (this can take a while)

## Translate the Content
**Grid content language:** the language of the grids, i.e. texts within grid elements or spoken custom texts.

AsTeRICS Grid can offer multilingual as well as monolingual standard grid sets (templates that can be imported). These templates can be imported after creating a new user respectively when using when AsTeRICS Grid the first time.

- *Multilingual grid sets* are one configuration which is translated to many languages. This means that the language can be switched by the user, since all translations are included within this configuration. Create this in cases where users should to be able to switch languages, e.g. a configuration used in a hospital which is used by different users speaking different languages.

- *Monolingual grid sets* is a grid set that is offered monolingual. This means that the configuration only contains one language and it's not possible to switch the language within this configuration. However it's still possible to translate the configuration and make it available in a separate monolingual configuration. Create this if a configuration is used by a single user speaking only one language. It has the advantage that the structure of the grids can be adapted to best fit a single language, which can be difficult for multilingual configurations.

You can translate an existing grid and then either export it as 
- multilingual grid if you haven't made any changes to the set up of the symbols or changed symbols or added new elements
- monolingual grid if you have made **any** language-specific changes besides translating words and setting up word forms to the grid set

### Translation of a multilingual default grid set
Follow these steps to publish a translation of an multilingual grid set:
* Create a new offline user with any username
* Import the grid set you want to translate or start with an empty configuration if you want to build something new
* Translate the grid set (see [chapter 13](12_multilingual-grid-sets.md))
* Create a backup with the new language via `Manage grids -> More (right top corner) -> Save backup to file`
* Send the file to [office@asterics-foundation.org](mailto:office@asterics-foundation.org) and we can add this translation to the default grid set! Alternatively you can also [directly create a Pull Request at AsTeRICS Grid Boards](https://github.com/asterics/AsTeRICS-Grid-Boards?tab=readme-ov-file#update-the-contents-of-the-boards-of-existing-configuration).

### Creation of a new monolingual default grid set
Follow these steps to publish a translation of a monolingual grid set:
* Create a new offline user with any username
* Import the grid set you want to translate or start with an empty configuration if you want to build something new
* Set the correct content language under "Settings":
* Translate the grid set (see chapter 14) or adjust configuration as you like and how it works best for the desired language. This can also be something completely different than the base grid set.
* Export the finished configuration using `Manage grids -> More (right top corner) -> Save custom data to file` and there select these options:
   * Export `All grids`
   * Select `Export only current content language`
   * Uncheck `Export dictionaries`
   * Check `Export global grid`
  <div><img src="https://github.com/user-attachments/assets/6d3adaf4-7041-4303-a715-ee0db5352dfb" width="650"/></div>
* Send the file to [office@asterics-foundation.org](mailto:office@asterics-foundation.org) and we can offer it as new default grid set! Alternatively you can also [directly create a Pull Request at AsTeRICS Grid Boards](https://github.com/asterics/AsTeRICS-Grid-Boards?tab=readme-ov-file#add-translated-version-of-monolingual-configuration).

[Back to Overview](README.md)