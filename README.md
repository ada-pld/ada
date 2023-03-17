<div align="center">
    <h1>WAP</h1>
    <a href="https://github.com/theohemmer/wap/releases" target="_blank" title="GitHub release (latest by date)">
    <img src="https://img.shields.io/github/v/release/theohemmer/wap" alt="GitHub release (latest by date)"/>
    </a>
    <p>Web-Administration-Panel, a tool to manage sprints and generate Project Log Documents</p>
</div>

<a href="#what-is-wap">What is WAP ?</a><br>
<a href="#installation">Installation</a><br>
<a href="#frontend">Frontend</a><br>
<a href="#contributing">Contributing</a>

## What is WAP ?

WAP is a tool originally developed by two EPITECH students to easily manage the creations of PLDs, and manage the cards assigned to each user on a sprint.

<b>The main idea behind WAP is to make more conscistent PLDs, with less errors, in less time.</b>

## How does it does that ?

To handle automatically the creation of the PLDs and ensure a faster and more accurate PLD, WAP is designed to integrate the user-stories in a sort of workflown and be robust about what can and can't be done.

The main problems WAP solves are the following:
- The PLD take too much time to make, one day everytime a new one must be done -- WAP shorten this time to 2 minutes.
- The PLD have many typos in it, many mistakes and errors -- WAP let you review every user-stories written by anyone before accepting them in the PLD.
- Peoples don't have informations on the progress of others peoples cards -- WAP let you view the progress of everyone in your team as well as what should be done.
- "I need to change the description of the card after having made the first PLD, can we do this without telling anyone ?" -- Yes you can do this. But this will be written.
- "PLD must be generated at 8:00" -- PLD <b>WILL</b> be generated at 8:00.
- "I didn't update my work on WAP" -- Then this will not appear on the PLD.

<b><u>Think of WAP as way to ensure the PLD is qualitative while making it in no time</u></b>

- When a card is submited by an user, the card goes for verification by admins and editors, if the card contains mistakes, the editors and admins can edit the card, then accept it. If the card is unnnaceptable, the card can be rejected.
- One a card is in the system, every edit made by admins and editors on the card will <i>(smartly)</i> increment the internal version of the card and display a message on the generated PLD accordingly.
- An user can't edit a card that has been accepted by an admin or an editor.

The generated PLD is fully programatically customizable, but you can use the generator we used in our team at <a href="src/defaultPldGenerator.ts">src/defaultPldGenerator.ts</a>

## Installation

To install WAP you'll need to have Docker and a MySQL database with a database ready for WAP.

Run WAP on Docker by redirecting the port 4000 and setting thoses environment variables:

```
git clone https://github.com/theohemmer/wap
cd wap
docker build -t wap \
    --build-arg BASE_API_URL="https://wap-dev.hemmer.dev/api/" \
    --build-arg BASE_URL="https://wap-dev.hemmer.dev" \
    --build-arg HOSTNAME="wap-dev.hemmer.dev" \
    .
docker run -d \
    -p 4000:80
    -p 4000:443
    -e PROD_DB_HOST="localhost"
    -e PROD_DB_NAME="WAP"
    -e PROD_DB_PORT="3306"
    -e PROD_DB_USER="root"
    -e PROD_DB_PASS="root"
    -e NODE_ENV="production"
    -e PORT="4000"
    -e PASS_SALT="passwordSalt"
```

## Frontend

The frontend application of WAP is primarly maintened by <a href="https://github.com/protoxvga">@protoxvga</a> on <a href="https://github.com/protoxvga/wap_ui">the WAP frontend repository</a>

## Contributing

WAP is open to contributions, feel free to open an issue, fork the repository, and create a PR