# Automate Couch-DB Setup

> NOTE: All commands and instructions are meant to be used on unix like environments. They might differ on windows.

## Prerequisits

* [Ansible 7.2.0](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html)

## Generate keys

```sh
# generate pub and priv kex
$ ssh-keygen -f <keyname>
```

## Private Keys and Public Keys

> NOTE: Never push private keys into the repository

> NOTE: You could push public keys into the repository, but it is not needed and thus not advised

```sh
# Create a folder called privKeys
$ mkdir privKeys
# Create a folder called pubKeys
$ mkdir pubKeys
# Put all your public keys inside this folder
```

## Domains

You need to set up the subdomains or domains for superlogin and couchdb in your DNS settings of your domain registrar or hosting provider.

Setup A records pointing to the IP address of your servers where you have ssh access.

## Setup users

This could also be put into a ansible playbook.

```sh
# login to server
$ ssh root@<ip>
# change pw of root on first login
$ sudo passwd root
# add new user
$ sudo adduser <username>
# add to sudoers
$ sudo usermod -aG sudo <username>
# change to user
$ su - <username>
# setup ssh keys
$ mkdir ~/.ssh
$ chmod 700 ~/.ssh
# add the public key
$ nano ~/.ssh/authorized_keys
$ chmod 600 ~/.ssh/authorized_keys
$ exit
# change ssh file
$ sudo nano /etc/ssh/sshd_config
# reload the ssh config
# !!!!! STAY LOGGED IN DURING THIS ATTEMPT !!!!!
# !!!!! IF YOUR CONFIG IS WRONG YOU CAN GET LOGGED OUT OF YOUR SERVER !!!!!
$ sudo systemctl reload sshd
```

## Add host files

> NOTE: Never push host files into the repository

Create a file called `hosts` in the root of this ansible folder and add the following:

```txt
[couchdbserver]
# <name-of-the-server> ansible_host=<ip-of-the-server> ansible_ssh_user=<username> ansible_ssh_private_key_file=<path/to/priv/key/file>

[authserver]
# <name-of-the-server> ansible_host=<ip-of-the-server> ansible_ssh_user=<username> ansible_ssh_private_key_file=<path/to/priv/key/file>
```

For example

```txt
[couchdbserver]
couchdbserver1 ansible_host=242.242.242.242 ansible_ssh_user=couchuser ansible_ssh_private_key_file=./privKeys/couchdb

[authserver]
authserver1 ansible_host=242.242.242.243 ansible_ssh_user=authuser ansible_ssh_private_key_file=./privKeys/auth
```

## Add envorinment variables

> NOTE: Never push environment variables into the repository

Create a file called `env.json` in the root of this ansible folder and add the following:

```json
{
  "COUCHDB_USER": "<username-for-couch-db>",
  "COUCHDB_PASSWORD": "<password-for-the-couch-db-user>",
  "EMAIL": "<email-address-for-ssl-certificate-issues>",
  "DOMAIN_NAME": "<your-domain-name>",
  "DOMAIN_NAME_AUTH": "<your-domain-name>",
  "DOMAIN_NAME_FLIP_MOUSE": "<your-domain-name>",
  "DOMAIN_NAME_FLIP_PAD": "<your-domain-name>",
  "DOMAIN_NAME_FABI": "<your-domain-name>",
  "REPOSITORY": "<your-repo-to-super-login-aka-astercis-grid>",
  "REPO_NAME": "<your-repo-to-super-login-aka-astercis-grid>",
  "PATH_TO_KEY": "<ssl-key-for-auth-server>",
  "PATH_TO_CERT": "<ssl-cert-for-auth-server>",
  "DB_SERVER_PROTOCOL": "<protocol-http-or-https>",
  "DB_SERVER_USER_DB": "<user-db-name-sl-users>",
  "DB_SERVER_COUCH_AUTH_DB": "<auth-db-name-_users>",
  "MAILER_FROM_EMAIL": "<pw-reset-email-address>",
  "MAILER_HOST": "<email-host>",
  "MAILER_PORT": "<email-port>",
  "MAILER_SECURE": "<boolean>",
  "MAILER_USER": "<email-user>",
  "MAILER_PASS": "<email-password>"
}
```
## Run Playbook

You need to be inside of the ansible folder to be able to run ansible playbooks

```sh
# will use the ansible.cfg + hosts file (holds connection details)
# use the appropriate password for the user
$ ansible-playbook <playbook-name>.yml --extra-vars "@env.json" --ask-become-pass
$ ansible-playbook -i secrets/hosts --ask-become-pass --extra-vars "@secrets/env.json" playbookAuth.yml
$ ansible-playbook -i secrets/hosts --extra-vars "@secrets/env.json" --tags "update" playbookAuth.yml
```


### Playbook names

* playbookCouchdb.yml - sets up the couchdb
* playbookAuth.yml - sets up the auth server + the redirect for 3 other projects (flipmouse, flippad, fabi)

### Playbook roles

Inside the roles folder there are all tasks and templates that are used for the configuration of the server.

When you need to change something, change the task or template and run the playbook again. It will skip tasks that have not changed and will only apply the changes.

The folders for superLogin tasks are prefixed with superLogin, and the folders for the couch db tasks are prefixed with couchDB

## Resolve issues

This section helps to fix common issues you will run into.

### WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!

When you reset your server (e.g. set it back to factory settings) and usually with that the fingerprint will cahnge as well.

You will need to remove the past recods of the known host like:

```sh
$ ssh-keygen -R <ip-address-of-your-server>
```

After that you will be asked to add the server to the known hosts again. You can do that by answering `yes`.

```sh
# The authenticity of host '<ip-address> (<ip-address>)' can't be established.
# ED25519 key fingerprint is SHA256:<some-key>.
# This key is not known by any other names
# Are you sure you want to continue connecting (yes/no/[fingerprint])?
$ yes
```
