fgallery - a modern, minimalist javascript photo gallery
--------------------------------------------------------

"fgallery" is a static photo gallery generator with no frills that has a
stylish, minimalist look. "fgallery" shows your photos, and nothing else.

You can see an example gallery at the following address::

  http://www.thregr.org/~wavexx/software/fgallery/demo/

There is no server-side processing, only static generation. The resulting
gallery can be uploaded anywhere without additional requirements and works with
most modern browsers.

- Automatically orients pictures without fuss and quality loss.
- Multi-camera friendly: automatically sorts pictures by timestamp:
  just throw your (and your friends) photos and movies in a directory.
  The resulting gallery shows the pictures in shooting order.
- Includes original (raw) pictures in a zip file for downloading.
- Includes full-size panoramas by default.


Usage
-----

1) Copy "view" into a destination path::

     cp -r view my-gallery

2) Generate all the static files with ./fgallery::

     ./fgallery photo-dir my-gallery

3) Upload "my-gallery" somewhere.

You actually need a web server to test the gallery due to AJAX/browser
restrictions. If you have python installed, a quick way to test the gallery
locally is to run::

  cd my-gallery
  python -m SimpleHTTPServer 8000

and then open http://localhost:8000 with a browser.


Usage notes
-----------

...


Dependencies
------------

Frontend/viewer: none (static html/js/css)

Backend:

* ImageMagick (http://www.imagemagick.org)
* exiftran (part of ``fbida``: http://www.kraxel.org/blog/linux/fbida/)
* zip
* perl, with the following additional modules:

  - JSON::PP (libjson-perl and optionally libjson-xs-perl)
  - Date::Parse (libtimedate-perl)

On Debian/Ubuntu, you can install all the required dependencies with::

  sudo apt-get install imagemagick exiftran zip libjson-perl libjson-xs-perl libtimedate-perl

If you are not using a Linux distribution you have to install ImageMagick and
exiftran from the source manually. The additional perl modules can be installed
using ``cpan``::

  cpan -i JSON::PP
  ...


Authors and Copyright
---------------------

"fgallery" can be found at http://www.thregr.org/~wavexx/software/fgallery/

"fgallery" is distributed under GPL2 (see COPYING) WITHOUT ANY WARRANTY.
Copyright(c) 2011-2013 by wave++ "Yuri D'Elia" <wavexx@thregr.org>
fgallery's GIT repository is publicly accessible at::

  git://src.thregr.org/fgallery


Extending fgallery
------------------

...


TODO
----

- Slow animation in FF sometimes. Slowness detection doesn't work in these cases
- Maybe use CSS transitions and degrade with a simple swap?
- Handle videos too
- Add an "overview" mode, which shows a screenful of thumbnails.
