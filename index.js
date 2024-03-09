#!/usr/bin/env node

/*
  gablib-lxer

  Consume LXer RSS feed and post to Gab group

  index.js (2024-02-22)

  ------------------------------------------------------------------------------
  This is a demo bot for https://github.com/TechSavage2/gablib
  See instructions in that repo for how to set up authentication.
  ------------------------------------------------------------------------------

  Copyright (c) 2024 Techsavage. MIT License.
*/

'use strict';

import path from 'node:path';
import { fileURLToPath } from 'url';
import { getXLerFeed } from './parser.js';
import { login, createStatus } from 'gablib';
import { sleep } from 'gablib/src/utils.js';

import Database from 'better-sqlite3';

const groupId = 'XXXXX';  // NOTE Set group ID here for the group you want to post to
const maxPosts = 4;       // For LXer

// when running in a crontab etc.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'lxer.db'));

// block some articles from posting since this is a newsfeed
const block = /install|installing|guide|setup|how to/gim;

// get the latest feed
let rss;
try {
  rss = await getXLerFeed();
}
catch(err) {
  console.error('Could not load page from LXer.', err.toString());
  process.exit(1);
}

// SQL queries
const sqlHasPost = db.prepare('SELECT COUNT(dateInt) count FROM posts WHERE dateInt = ?');
const sqlInsertPost = db.prepare('INSERT INTO posts VALUES (@dateInt, @link, @target, @title, @description, @author, @date, @section, @collected, 0, 0)');
const sqlSetPosted = db.prepare('UPDATE posts SET posted = 1 WHERE dateInt = ?');

for(const item of rss) {
  if ( sqlHasPost.get(item.dateInt).count === 0 ) {
    item.target = await getTarget(item.link);
    if ( item.target === null || sqlInsertPost.run(item)[ 'changes' ] !== 1 ) {
      console.error(`Could not insert post: "${ item.title }"`, item.target);
    }
  }
}

// get new posts
const posts = db
  .prepare(`SELECT * FROM posts WHERE posted = 0 AND error = 0 ORDER BY dateInt LIMIT ?`)
  .all(maxPosts)
  .reverse();

if ( posts.length ) {
  const lo = await login(); // NOTE set the env with your username, password etc. See gablib for info.

  // new posts for gab group
  for(let post of posts) {
    if ( !post.title.match(block) ) {
      const txt = getFormatted(post);
      const result = await postStatus(lo, txt);
      if ( result.ok ) {
        if ( sqlSetPosted.run(post.dateInt)[ 'changes' ] !== 1 ) {
          console.error(`Could not update status of post: "${ post.title }"`);
        }
      }
      else {
        console.error(`Could not post: "${ post.title }"`, result.error);
      }
      await sleep(1000);
    }
    else {
      console.warn(`Ignoring post "${ post.title }" due to block words.`);
      if ( sqlSetPosted.run(post.dateInt)[ 'changes' ] !== 1 ) {
        console.error(`Could not update status of post: "${ post.title }"`);
      }
    }
  }
}

// format the record into markdown for the Gab status
function getFormatted(post) {
  let txt = `### ${ post.title }\n\n`;
  txt += `"${ post.description }"\n\n`;
  txt += `${ post.target }\n\n`;
  if ( post.section.length ) {
    txt += `#${ post.section } `;
  }
  else {
    txt += `#linux `;
  }
  txt += `#lxer`;
  return txt;
}

// post to Gab group
async function postStatus(lo, txt) {
  const result = await createStatus(lo, txt, { groupId });
  if ( result.ok ) {
    return { ok: true, error: null };
  }
  else {
    return { ok: false, error: result.status };
  }
}

// get the actual link from the LX post
async function getTarget(url) {
  const result = await fetch(url, { method: 'HEAD', redirect: 'manual' });
  let link = null;
  if ( result.status === 302 ) {
    link = result.headers.get('location');
    link = link.replace('go.theregister.com/feed/', '');  // remove another link redirect
  }
  return link;
}
