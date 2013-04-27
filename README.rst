gallery - a modern, minimalist javascript photo gallery
-------------------------------------------------------

I wanted just a web gallery with no frills that doesn't look like it's year
2000 again. No server-side processing, only static generation. Couldn't find
any OSS project I liked, so I made one.

Please note: ... right now it's rather incomplete.

Demo: http://www.thregr.org/~wavexx/tmp/gallery-demo/

Usage:

- Copy "view" into a destination path.
- Generate all the static files with ./gendata::

    ./gendata photo-dir dest-view-dir

"gallery" is distributed under GPL2 (see COPYING) WITHOUT ANY WARRANTY.
Copyright(c) 2011 by wave++ "Yuri D'Elia" <wavexx@users.sf.net>.
Source repository available at::

  git://src.thregr.org/gallery

TODO:

- Preload next image
- Differentiate between normal and panorama shots in the thumbnail (black bands?)
- Handle panorama shots (allow to zoom/pan?)
- Slow animation in FF sometimes. Slowness detection doesn't work in these cases
- Maybe use CSS transitions and degrade with a simple swap?
- Show prev/next arrows at startup, then implement autohide
- Handle videos too
