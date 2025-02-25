# Frequently Asked Questions

[Back to Overview](README.md)

This page contains information about frequently asked questions about AsTeRICS Grid.
*Updated: 31 Jan 2025*

## AsTeRICS Grid is currently free. Is it possible that this changes in the future?
No, AsTeRICS Grid will always remain free and open-source. It is developed within funded projects.

## What happens if funding ends?

Funding is essential to cover server costs and continue developing new features. Without sufficient funding, the **synchronization feature** (which enables syncing boards across devices) will become unavailable. The app itself is hosted on **GitHub**, so it will still function. As an **open-source project**, the source code can be downloaded and hosted on other servers by anyone and any developer can continue to develop.

## Is AsTeRICS Grid a robust AAC app?

AsTeRICS Grid provides a **flexible framework** for creating robust AAC grid sets, including flexible layouts, support for word forms and grammar, keyboards with prediction, and support for multiple languages. Further improvements, such as the option to set progressive language, are in development.  

Since AsTeRICS Grid doesn’t have a dedicated team creating grid sets, the availability of fully developed robust grid sets depends on **user contributions**. A feature enabling users to share their boards publicly in collaboration with **globalsymbols** is in progress.

## Which languages are available in AsTeRICS Grid?

The available languages depend on the platform you're using. Check [chapter 11](11_voices.md) for details.  

## Can I recover the password of my online user?
We care about the protection of private data that can be inserted into grids, e.g. images or sound recordings. Therefore we've designed AsTeRICS Grid in a way where only the user itself can see his/her data, nobody else. All data of online users is encrypted using the password of the user. So even if we have access to the database, we cannot see anything but encrypted, unreadable data. While that's great for privacy, it also has this major drawback:

It's **not possible to reset or recover the password of an online user**. If the password of an online user is lost, also the data of this user is lost and cannot be recovered.

So there are two things that are important in order to prevent loosing data:
* keep the usernames and passwords of your online users safe, write them down somewhere or use a password safe software for saving them.
* regularily download backups of your user's data to file. AsTeRICS Grid automatically reminds for downloading backups, but it can be done at any time by going to `Manage grids -> More (right top) -> Save backup to file`. Backups saved to file are not encrypted and therefore can be used and imported for a new user.

### Transfer data to new user
If you've lost the password of a user and you're still logged in with this user on any device, just make a backup to file, create a new user and import the data from the backup there. Follow these steps:
* Go to `Manage grids -> More (top right corner) -> Save backup to file`
* Create a new online user (and note your new password somewhere)
* Select `Restore backup from file` at the bottom: <div><img src="https://github.com/asterics/AsTeRICS-Grid/assets/2537025/9333ef5c-899b-458e-8ad5-f142e6c20098" width="400"/></div>
* Continue to use the new online user on other devices

## The global grid disappeared or the "Home" button doesn't work
If the global grid (first line including navigation to "Home" and "Back" and line for collecting elements) disappears or doesn't work as expected any more, try this:
* go to "Manage Grids"
* scroll all down to the bottom of the page
* select the correct home grid at `Select Home grid for creating global Grid`
* Click on `Reset global grid to default`

Also see this screenshot:
![grafik](https://user-images.githubusercontent.com/2537025/235093846-96ec29f7-267f-42b0-8181-d5d6612adffa.png)

## Allow mixed content (http/https)

In order to be allowed to access a local network (e.g. OpenHAB for environmental control), it may be necessary to allow mixed content in the current page.
You can do according to the following steps:

### Allow mixed content Firefox
With the OpenHAB editing action opened,

1. Click on the lock symbol left to the address bar.
2. Click on ```Connection secure```
3. Click on ```Disable protection for now```

![image](https://github.com/asterics/AsTeRICS-Grid/assets/4621810/840d4f6d-20c1-4406-a0c8-0cbd77d5d2f9)

### Allow mixed content Chrome
With the OpenHAB editing action opened, 

1. Click on ```Not secure``` left to the address bar.
2. Click on ```Site settings```
3. **Allow** ```Insecure contents```

![image](https://github.com/asterics/AsTeRICS-Grid/assets/4621810/8bbe29a5-e5bd-4ece-bd28-ae4bb3c0e0b3)

[Back to Overview](README.md)