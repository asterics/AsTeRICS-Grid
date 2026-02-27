# Collaboration

This document contains info about for collaborating in the development of AsTeRICS Grid.

## Create issues
Everyone is welcome to [create issues on GitHub](https://github.com/asterics/AsTeRICS-Grid/issues/new). Keep in mind these rules:
1. **One topic**: every issue should only address a single topic.
   * don't create issues like *"I've found this bug and at the same time I have the idea for that feature..."*
2. **Avoid huge issues**: huge topics (like *make Asterics WCAG compliant*) should be split to several issues, if possible.
   * e.g. create sub-issues like *make modals WCAG compliant* and *make keyboard navigation WCAG compliant*, ...
3. **Clear title**: give your issue a meaningful title that helps to quickly identify the main topic
   * better use something like *"Bug: english computer voice not working on Android"* instead of *"I cannot hear anything"*
4. For issues **describing a bug**:
   * if possible include **steps how to reproduce the bug**
   * add **details about the device, operating system and used browser**
   * include **error logs** (`Ctrl + Shift + I` to open JavaScript console on desktop browsers)
5. For issues **describing a new idea or feature**:
   * explain why this feature is needed in **real life for real persons** (there are many great ideas which aren't really needed or used in real life)
   * if possible provide a proposal how the UI of your new features should look like (e.g. modified screenshots)

### Labelling of issues
There are these labels for issues:
* [good first issue](https://github.com/asterics/AsTeRICS-Grid/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22): issues that could be solved by first-time contributors
* [needs-beta-review](https://github.com/asterics/AsTeRICS-Grid/issues?q=state%3Aopen%20label%3A%22needs-beta-review%22): issues with existing pull request, where the beta release can be reviewed (functional review)
* [needs-code-review](https://github.com/asterics/AsTeRICS-Grid/issues?q=state%3Aopen%20label%3Aneeds-code-review): issues where functional review of beta release was approved, but need code review before merging the PR.
* `priority-[id]`: issues which have high priority are labelled with `priority` tags. The `id` in the tag specifies which person or subproject needs this issue with priority.
   * examples: [priority-arasaac](https://github.com/asterics/AsTeRICS-Grid/issues?q=state%3Aopen%20label%3Apriority-arasaac) and [priority-mialingvo](https://github.com/asterics/AsTeRICS-Grid/issues?q=state%3Aopen%20label%3Apriority-mialingvo)

## Working on issues
This is the workflow if you want to work on an issue:
* Check if the issue is already assigned to another person on GitHub. If yes, contact the person and ask if he/she is still working on it or if you could start working on the issue.
* Assign yourself to the issue. If you don't have the right to do it:
   * write to office@asterics-foundation.org and ask to be added as collaborator to the project on Github
   * as an alternative fork the project on Github, leave a comment that you're working on the issue and start to work on it in your fork.
* switch to git branch `master` and update `git checkout master && git pull`
* create a new branch for your issue (if not working on your own fork). The branch name should be something like `issue#<issue-number>/short-description-of-issue`
* for commit messages:
   * include the issue number
   * try to avoid huge commits, but keep them small, only having one change at a time
   * e.g. *#123 prevent null pointer exception if user is empty*
* when you think you've solved the issue, create a PR for merging it to the `master` branch
* create a comment in the PR referencing the issue number for linking PR and issue
* a GitHub workflow will automatically create a preview release for testing your changes and comment the link for testing to your PR
* comment the URL for the preview release to the issue and ask other people to test your changes
* add label `needs-beta-review` to the issue, signaling that it is ready for functional test and feedback
* after the changes are approved (functional) within the issue, request a code review in the PR, add label `needs-code-review` to the PR.
* the **issue is for discussing the implementation from the user's side** (UI, testing environment) while the **PR is for discussing the code changes and technical background**
* after both the functionality and the code is approved, the PR will merged to branch `master` and released with the next release

### Rules for Pull Requests
For code changes and pull requests please note these rules:
1. **Minimal changes**: keep the code changes minimal - don't change things which doesn't address the issue you're working on
   * exception: if you think that some changes would benefit from bigger code refactorings, please explain them in your PR
2. **Reference issue**: reference the issue you're working on in a PR comment
3. **AI usage**: PRs fully generated from any AI tool (e.g. ChatGPT, Gemini, CoPilot etc.) are not reviewed.


## Review and test open PR's
You're welcome to test open PR's and add your comments or code reviews.

## Working on translations
Please see [Translation of AsTeRICS Grid](../documentation_user/contributing-to-ag.md#translate-the-application) for information how to contribute translations of the application or the content.

<!--
## Internal collaboration
This section is for people who have access to our email address and servers.

### Responding to email requests
For emails regarding AsTeRICS Grid received at `office@asterics-foundation.org` the general rule is:
* We answer all non-spanish requests
* Spanish requests are redirected to the social media platforms that are maintained by ARASAAC. Use this mail to respond to Spanish requests:

```
Hello,

thanks for contacting us. Unfortunately we at the AsTeRICS Foundation cannot provide support in Spanish.
Please to go our Instagram or Facebook pages maintained by ARASAAC and send them a private message there including your questions:
https://www.instagram.com/asterics_grid/
https://www.facebook.com/asterics.grid.y.arasaac

If you don't use social media you can also write directly to ARASAAC via mail:
arasaac@aragon.es

We're also trying to create a community around AsTeRICS Grid on Github discussions: https://github.com/asterics/AsTeRICS-Grid/discussions
If you want to register on Github and you think your question (and it's answer) could be usable for other people, please consider posting your question there.

Thanks and best regards,
<Name>
```

In general try to point people with requests to Github discussions, by adding a line like this at the end of your response:
```
We're trying to create a community around AsTeRICS Grid on Github discussions: https://github.com/asterics/AsTeRICS-Grid/discussions
If you want to register on Github and you think your question (and it's answer) could be usable for other people, please consider posting your question there.
```

### Checking the server
Please go to [grid.asterics.eu](https://grid.asterics.eu/) regularly and check if login with an existing online user is working. On the bottom left you should see the cloud symbol with a checkmark. If not, contact office@asterics-foundation.org

-->

[Back to Overview](README.md)
