Demo bot for gablib
===================

This code demonstrates how you can make a simple bot to consume a RSS feed and post to Gab in a
group.

For instructions on how to set up authentication for your Gab account, please see the main repo:

https://github.com/TechSavage2/gablib

The code is JavaScript and requires Node.js or Bun.

Installation
------------

Clone this repo using git, or download the compressed archive and unpack.

From inside the root directory, run:

```npm
$ npm i
```

to install the dependencies.

You are now ready to run the code provided you have set up authentication for your Gab account and
changed the code in index.js with proper group id.

Each run will consume the RSS feed from LXer and post new posts to the Gab group you specified.

```bash
$ node .
```

A SQLite database is provided for convenience already populated with some data.

To run from a crontab you need to copy your environmental variables (auth) to the crontab file
itself.

You are free to modify this code in any way you like.

MIT License (c) 2024 TechSavage
