# WAP

A web administration panel for managing sprints and generating PLDs

# Usage

## Informations about usage

I've tried to make this application usable by as many people as possible.

When you launch the application for the first time, you will be redirected to a page to create the default account on the application, this will be an administrator account.

I recommand to not have a lot of administrator since they have access to the SMTP settings of the application.

Once you've created the default account, you will be redirected to the settings page of the application, here you can choose to use a SMTP transporter to send mail from the application.

From now, the mail are only used to send their password to the newly created users, but latter in the development, this will also include remainder for the user to mark their task as completed before the PLD is generated, mail to inform that a PLD has been generated, mails to inform of a new card or card status change etc...

## Features of WAP

The Dashboard tab is to see your active cards on the sprint, and changing their status, with a quick overview of what's done.

The My Cards tab is to create a new User Story that will be mark as waiting for approval and viewing your cards.

The Rendez-vous tab is under development.

The Users tab is to create new users and managing their role.

The Cards tab is to view all User Stories of the current sprint, aprove, eddit or reject them.

The Sprint tab is to create a new Sprint and select a sprint as active, one a sprint is selected, you will see stats for all users on the sprint

The PLD tab is to generate the PLD, it's still under development but should be finished before version 1.0.0

The Config tab is to manage the configuration of WAP

## Types of Users account

There is 4 types of account on WAP:

ADMIN:
- Access to the config of the app
- All bellow

EDITOR:
- Access to the lists of Users
- Creation and edition of users
- Editions of User Stories
- Approbation / Rejection of User Stories
- Creating and selecting a Sprint
- View stats for all users
- Creating new parts
- Generating PLD
- Changing the default PLD generator to a custom one
- All bellow

MAINTAINER:
- Adding a new card
- Beeing assigned on a card
- View the cards they are asisgned on
- Changing the status of their cards
- All bellow

USER:
- Downloading the last PLD

## Generating the PLD

The pld is generated using a default generator that format the card as we do on my team. But once completly implemented, you will be able to change the default generator to switch on a custom one.

This is usefull if you don't want your PLD to have the same look as ours, and want to use you're own, if this is the case, you will be able to see all informations about switching to a custom generator on the PLD tab once the feature will be finished, if you're curious, you can already take a look inside [The customPldGenerator.js file](pldGenerator/custom/customGenerator/customPldGenerator.js`)


# Installation

This project is still in development, there might be some issues with it and some features described belllow may change during development.

To use this application you will have to connect it to a MySQL database
To do so, create a .env file, containing the following:
```
DB_HOST=<the host of your database>
DB_PORT=<the port of your database>
DB_USER=<user to connect on your database>
DB_PASS=<password of the database>
DB_NAME=<name of the database>
ENVIRONMENT=production
PORT=4000
PASS_SALT=<salt for password>
```
Be aware that changing the value of PASS_SALT after having users created on your databse will prevent them from connecting.

Once you have the .env file, run `npm install` then `cd pldGenerator && npm install` to install the dependencies

After that, you will have to go to the root folder of the application, and build it, to do so use the command `npm run buildMail` then `npm run build`

You will then have to perform the migrations on the database using `npx sequelize db:migrate`

Once you've build the project, everything is ready, just run the command `npm start`

# Docker

This project also come with a Dockerfile that do all the step notted bellow, note that if you're running it inside a Docker, you will have to creates two volumes,

One volume for the custom generator in `./pldGenerator/custom/customGenerator`

And one volume for the generated PLDs in `./pldGenerator/generated`

# Contributing

This project is open to contributions, if you want to add your own features, you can also ask for features by openning an issue if you want.