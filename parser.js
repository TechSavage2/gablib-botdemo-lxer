/*
  gablib-lxer

  Fast Parser for LXer RSS feed

  parser.js (2024-02-22)

  Copyright (c) 2024 Techsavage

*/

'use strict';

import decode from 'html-entities-decoder';

const commonUserAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.1; rv:109.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (X11; Linux i686; rv:109.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (X11; Fedora; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/122.0'
];

export async function getXLerFeed() {
  // Get RSS feed
  const result = await fetch('http://lxer.com/module/newswire/headlines.rss', {
    headers: {
      'User-Agent': commonUserAgents[ (commonUserAgents.length * Math.random()) | 0 ]
    }
  });

  // Parse (this is a crude parser - you may want to use something more "solid" in case the feed structure changes in the future)
  const xml = await result.text();

  // skip first site title and verify-ish we have an XML
  let i = xml.indexOf('<title>');
  if ( i < 0 ) throw new Error('Did not find first title tag.');
  i += 6;

  const tags = [ 'title', 'link', 'description', 'dc:creator', 'dc:subject', 'dc:date', 'slash:section' ];
  const props = [ 'title', 'link', 'description', 'author', 'subject', 'date', 'section' ];

  const posts = [];
  let item = {};
  let isLast = false;
  let t = i;

  while( !isLast ) {
    tags.forEach((tag, index) => {
      i = xml.indexOf(`<${ tag }>`, i);
      if ( i > 0 ) {
        t = xml.indexOf(`</${ tag }>`, i);
        item[ props[ index ] ] = decode(xml.substring(i + tag.length + 2, t));
        i = t + tag.length;
      }
      else {
        isLast = true;
      }
    });

    if ( !isLast ) {
      item.dateInt = new Date(item.date).getTime();
      item.collected = Date.now();
      posts.push(item);
      item = {};
    }
  }

  return posts;
}
