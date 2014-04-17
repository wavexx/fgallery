fgallery: a modern, minimalist javascript photo gallery
=======================================================

"fgallery" is a static photo gallery generator with no frills that has a
stylish, minimalist look. "fgallery" shows your photos, and nothing else.

You can see an example gallery at the following address:

http://www.thregr.org/~wavexx/software/fgallery/demo/

There is no server-side processing, only static generation. The resulting
gallery can be uploaded anywhere without additional requirements and works with
any modern browser.

- Automatically orients pictures without fuss and quality loss.
- Multi-camera friendly: automatically sorts pictures by time: just throw your
  (and your friends) photos and movies in a directory. The resulting gallery
  shows the pictures in seamless shooting order.
- Adapts to the current screen size and proportions, switching from
  horizontal/vertical layout and scaling thumbnails automatically.
- Supports face detection for improved thumbnail centering.
- Loads fast! Especially over slow connections.
- Includes original (raw) pictures in a zip file for downloading.
- Panoramas can be seen full-size by default.


Usage
-----

1) Generate all the static files with ./fgallery::

     ./fgallery photo-dir my-gallery

2) Upload "my-gallery" somewhere.

You actually need a web server to test the gallery locally (only due to
AJAX/browser restrictions). If you have python installed, a quick way to test
the gallery locally is to run::

  cd my-gallery
  python -m SimpleHTTPServer 8000

and then open http://localhost:8000 with a browser.


Usage notes
-----------

The images as shown by the viewer are scaled/compressed using the specified
quality to reduce viewing lag. They are also stripped of any EXIF tag. However,
the pictures in the generated zip album are preserved *unchanged*.

Lossless auto-rotation is applied so that images can be opened with a browser
directly. JPEG and PNG files are also re-optimized (losslessy) before being
archived to furthermore save space.

Preview and thumbnail images are converted to the sRGB color-space by default,
which provides better results on normal displays and browsers without color
management support.

All images can be included to be viewed individually at full resolution in the
gallery by using the ``-i`` flag. Panoramas are automatically detected and the
original image is included in full-size by default, as often the image preview
alone doesn't give it justice.

For best results when shooting with multiple cameras (or friends), synchronize
the camera clocks before starting to take pictures. Just pick one camera's time
as the reference. By doing this the album is automatically shown in logical
shooting order instead of file-name order.

Never use the ``-s`` or ``-d`` flags. Let your friends and viewers download the
raw album at full resolution, not the downscaled crap. Don't make me angry.


Tuning thumbnail generation
---------------------------

The sizes of the thumbnails and the main image can be customized on the command
line with the appropriate flags. Two settings are available for the thumbnail
sizes: minimum (150x112) and maximum (267x200). Thumbnails will always be as
big as the minimum size, but they can be enlarged up to the specified maximum
depending on the screen orientation. The default settings are tuned for a
mostly-landscape gallery, but they can be changed as needed.

Images having a different aspect ratio (like panoramas) are cut and centered
instead of being scaled-to-fit, so that the thumbnail shows the central subject
of the image instead of a thin, unwatchable strip. When this happens, the
viewer shows a sign on the thumbnail along the cut edges (this effect can be
seen in the demo gallery).


Portraits and face detection
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

To simply favor photos shot in portrait format, invert the width/height of the
thumbnail sizes::

  ./fgallery --min-thumb 112x150 --max-thumb 200x267 ...

This will force the thumbnails to always fit vertically, at the expense of a
higher horizontal thumbnail strip.

If your photos are mixed and can contain people, faces or portraits, you can
enable face detection by using the ``-f`` flag and installing `facedetect
<http://www.thregr.org/~wavexx/hacks/facedetect/>`_.

Face detection will ensure that the thumbnails, especially when cut, will be
centered on the face of the subject. If face detection is enabled, there's
generally no need to increase the thumbnail size.


Color management
----------------

As of 04/2014, Safari on Mac is, sadly, the only browser/platform that properly
supports color management by default and that can take advantage of built-in
color profiles.

Due to the general lack of color management, preview and thumbnail images are
converted from the built-in color profile the sRGB color-space by default.

From a normal user perspective, the resulting images will appear to be closer
to true colors. The conversion will generally cause an increase in color
saturation, overall contrast and a lighter appearance of dark regions, which
would otherwise be indistinguishable on the screen.

Viewed from a properly calibrated or wide-gamut display instead the difference
is usually *very* subtle, with only deeply-saturated colors being "capped" due
to the effective reduction of absolute color depth.

We'd like to mention that Firefox *has* color-management support, but it's
disabled by default on all platforms, and it has known bugs with LUT profiles
(though the more common Matrix profiles seem to work fine).

The installation of the following "Color Management" add-on is recommended:

https://addons.mozilla.org/en-US/firefox/addon/color-management/

When installed, in the add-on configuration, you'll need to enable color
management for "All images" (since sRGB has no ICC profile attached by
definition) and restart the browser. Also, if you have a multi-monitor setup,
it's advisable to manually set the "Display profile" to the external/calibrated
screen, since FF won't automatically select the "current" color profile, and
just default to the first available screen.

If you care about color management, please complain/contribute to any of the
existing `bug reports`_ in Firefox.

.. _bug reports: https://bugzilla.mozilla.org/buglist.cgi?component=GFX%3A%20Color%20Management&product=Core&bug_status=__open__


Dependencies
------------

Frontend/viewer: none (static html/js/css)

Backend:

* ImageMagick (``imagemagick``, http://www.imagemagick.org)
* LittleCMS2 utilities (``liblcms2-utils``, http://www.littlecms.com/).
* Either:

  - ``exiftran`` (part of ``fbida``: http://www.kraxel.org/blog/linux/fbida/), or
  - ``exifautotran`` (part of ``libjpeg-progs``: http://libjpeg.sourceforge.net/).

* zip
* perl >= 5.14 (threading support enabled), with the following `required` modules:

  - Image::ExifTool (``libimage-exiftool-perl``: http://owl.phy.queensu.ca/~phil/exiftool/)
  - JSON (``libjson-perl``, http://search.cpan.org/dist/JSON/lib/JSON.pm)

  and the following additional `recommended` modules:

  - JSON::XS (``libjson-xs-perl``)

Several other tools are supported, but are only used when installed.
Therefore it's also helpful to install:

* jpegoptim (http://www.kokkonen.net/tjko/projects.html, for JPEG size optimization)
* pngcrush (http://pmt.sourceforge.net/pngcrush/, for PNG size optimization)
* facedetect (http://www.thregr.org/~wavexx/hacks/facedetect/, for face detection)
* p7zip (http://www.7-zip.org/, for faster and higher-compression zip archiving)

On Debian/Ubuntu, you can install all the required dependencies with::

  sudo apt-get install imagemagick exiftran zip liblcms2-utils
  sudo apt-get install libimage-exiftool-perl libjson-perl libjson-xs-perl

To save more space in the generated galleries, we recommend installing also the
optional dependencies::

  sudo apt-get install jpegoptim pngcrush

For face detection support, simply follow the `facedetect installation
instructions <http://www.thregr.org/~wavexx/hacks/facedetect/#dependencies>`_.

For performance reasons, we recommend installing also ``p7zip`` which is
considerably faster during compression thanks to multi-threading support::

  sudo apt-get install p7zip

On a Mac, we recommend installing the dependencies using `MacPorts
<http://www.macports.org/>`_. After installing MacPorts, type::

  sudo port install imagemagick lcms2 exiftran jpegoptim pngcrush
  sudo cpan -i JSON JSON::XS Image::ExifTool


Installation
------------

Installation is currently optional. If needed, copy the extracted directory to
a directory of your liking and link `fgallery` appropriately::

  sudo cp -r fgallery-X.Y /usr/local/share/fgallery
  sudo ln -s /usr/local/share/fgallery/fgallery /usr/local/bin


Authors and Copyright
---------------------

"fgallery" can be found at http://www.thregr.org/~wavexx/software/fgallery/

"fgallery" is distributed under GPL2 (see COPYING) WITHOUT ANY WARRANTY.
Copyright(c) 2011-2014 by wave++ "Yuri D'Elia" <wavexx@thregr.org>.
fgallery's GIT repository is publicly accessible at::

  git://src.thregr.org/fgallery


Extending fgallery
------------------

"fgallery" is composed of a backend (the "fgallery" script) and a viewer
(contained in the "view" directory). Both are distributed as one package, but
they are designed to be used also independently.

"fgallery" just cares about generating the image previews and the album data.
All the presentation logic however is inside the viewer.

It's relatively easy to generate the album data dynamically and just use the
viewer. This was my aim when I started to develop "fgallery", as it's much
easier to just modify an existing CMS instead of trying to reinvent the wheel.
All a backend has to do is provide a valid "data.json" at some prefixed
address. A plugin for a CMS such as `Gallery <http://galleryproject.org/>`_
should be very easy to implement.


TODO
----

- Handle videos too
- Add an "overview" mode, which shows a screenful of thumbnails.
- Allow to hide the thumbnails entirely.
- Improve EXIF/header display.
