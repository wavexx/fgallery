fgallery: a modern, minimalist javascript photo gallery
=======================================================

"fgallery" is a static photo gallery generator with no frills that has a
stylish, minimalist look. "fgallery" shows your photos, and nothing else.

You can see an example gallery at the following address:

https://www.thregr.org/~wavexx/software/fgallery/demo/

There is no server-side processing, only static generation. The resulting
gallery can be uploaded anywhere without additional requirements and works with
any modern browser.

- Automatically orients pictures without quality loss.
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

To test/preview the gallery locally using Firefox, you can just open the file
``my-gallery/index.html``. On other browsers you need a web server (due to AJAX
same-origin restrictions). If you have python installed, a quick way to test
the gallery locally is to run::

  cd my-gallery
  python -m SimpleHTTPServer 8000

and then navigate to http://localhost:8000.


Pre-built packages
------------------

Pre-built packages for `fgallery` (and `facedetect`) are available:

**Debian/Ubuntu**

- https://packages.debian.org/fgallery
- https://packages.debian.org/facedetect

Install with::

  sudo apt-get install fgallery facedetect

**Arch Linux**

- https://aur.archlinux.org/packages/fgallery/

Install with::

  sudo pacman -S fgallery

**Gentoo Linux**

- https://github.com/robert7k/gentoo-overlay/tree/master/www-apps/fgallery/

Install with::

  sudo layman -a robert7k
  sudo emerge www-apps/fgallery

**NixOS**

- https://github.com/NixOS/nixpkgs/blob/master/pkgs/tools/graphics/fgallery/

Install with::

  sudo nix-env -i fgallery

**Docker**

You can also try the latest `fgallery` bundled with facedetect_ in a Docker
container using the following ``Dockerfile`` provided by Stavros Korokithakis:

- https://github.com/skorokithakis/docker-fgallery


Usage notes
-----------

The images as shown by the viewer are scaled/compressed using the specified
quality to reduce viewing lag. They are also stripped of any EXIF tag. However,
the pictures in the generated zip album are preserved *unchanged*.

Lossless auto-rotation is applied so that images can be opened with a browser
directly. JPEG and PNG files are also re-optimized (losslessy) before being
archived to furthermore save space.

Image captions are read from simple text files or directly from EXIF metadata.
Captions can be controlled by the user using the "bubble" icon or by pressing
the "c" keyboard shortcut, which cycles between normal/always hidden/always
shown visualization modes.

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
<https://www.thregr.org/~wavexx/software/facedetect/>`_.

Face detection will ensure that the thumbnails, especially when cut, will be
centered on the face of the subject. If face detection is enabled, there's
generally no need to increase the thumbnail size.


Image captioning
----------------

Several sources for image captions are automatically read by fgallery. These
can be customized though the ``-c`` flag in the command line, which consists of
a comma-separated list of any of the following:

:``txt``: Detached captions in a simple text file.
:``xmp``: Captions read from XMP sidecar metadata.
:``exif``: Captions read from EXIF metadata.
:``cmt``: Captions read from JPEG or PNG's built-in "comment" data.

You can disable caption extraction entirely by using ``-c none``. When multiple
methods are provided, the first available caption source is used. By default,
the method list is ``txt,xmp,exif``.

The ``txt`` method reads the caption from a text file that has the same name as
the image, but with ``txt`` extension (for example ``IMG1234.jpg`` reads from
``IMG1234.txt``). The first line of the file (which can be empty) constitutes
the title, with any following line becoming the description. These files can
either be written manually, or can be edited more conveniently using the
``utils/fcaption`` utility. ``fcaption`` accepts a list of filenames or
directories on the command line, and provides a simple visual interface to
quickly edit image captions in this format.

``XMP`` or ``EXIF`` captions can be edited easily with many other image
editing/previewing programs, such as Darktable_ (which writes XMP sidecar files
by default) or Geeqie_ (use Ctrl+K to bring up the metadata editor).

Both JPEG and PNG have a built-in comment field, but it's not read by default
as it's often abused by editing software to put attribution or copyright
information. When enabled, the comment is parsed as for ``txt`` files: the
first line is the title, with any subsequent line becoming the description.

Captions are intended to be short. Do not write long or distracting
descriptions. Captions should *never* contain copyright information.
*Do not abuse captions*.

.. _darktable: http://www.darktable.org/
.. _geeqie: http://geeqie.org/


Color management
----------------

A pledge
~~~~~~~~

Since every camera is different, and every monitor is different, some color
transformation is necessary to reproduce the colors on your monitor as
*originally* captured by the camera. `Color management`_ is an umbrella term
for all the techniques required to perform this task.

Most image-viewing software support color management to some degree, but it's
rarely configured properly on most systems except for Safari on Mac OSX. No
other browser, unfortunately, supports decent color management.

This causes the familiar effect of looking at the same picture from your laptop
and your tablet, and noticing that the blue of the sky is just slightly off, or
that colors look much more contrasty on one screen as opposed to the other.
Often the image *has* the information required for a more balanced color
reproduction, but the browser is just ignoring it.

We're writing this down because Firefox *has* built-in color-management
support, but it's disabled by default on all platforms. It's also ranking very
low on the list of improvements to make, with some bugs being open for years.
In an attempt to raise awareness, please complain/contribute to any of the
existing `bug reports`_, citing the `Technical details`_ on this web page.

.. _Color management: http://en.wikipedia.org/wiki/Color_management
.. _bug reports: https://bugzilla.mozilla.org/buglist.cgi?component=GFX%3A%20Color%20Management&product=Core&bug_status=__open__


Technical details
~~~~~~~~~~~~~~~~~

On Firefox, the installation of the following "Color Management" add-on is
recommended:

https://addons.mozilla.org/en-US/firefox/addon/color-management/

When installed, in the add-on configuration, you'll need to enable color
management for "All images" and restart the browser. Also, if you have a
multi-monitor setup, it's advisable to manually set the "Display profile" to
the external/calibrated screen, since FF won't automatically select the color
profile for the current monitor, and just default to the primary. Firefox has
also known bugs with LUT profiles, though the more common Matrix profiles seem
to work fine.

We understand that CM has a considerable impact on image rendering performance,
but strictly speaking CM doesn't need to be enabled on all images by default.
It would be perfectly fine to have an additional attribute on the image tag to
request CM. The current method of enabling CM only on images with an ICC
profile is clearly not adequate, since images without a profile should be
assumed to be in sRGB color-space already.

Because of the general lack of color management, `fgallery` transforms the
preview and thumbnail images from the built-in color profile to the sRGB
color-space by default. On most devices this will result in images appearing to
be *closer* to true colors with only minimal lack of absolute color depth. As
usual, no transformation is done on the original downloadable files.


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

  and the following additional `recommended` modules:

  - Cpanel::JSON::XS (``libcpanel-json-xs-perl``)

Several other tools are supported, but are only used when installed.
Therefore it's also helpful to install:

* jpegoptim (http://www.kokkonen.net/tjko/projects.html, for JPEG size optimization)
* pngcrush (http://pmt.sourceforge.net/pngcrush/, for PNG size optimization)
* facedetect (https://www.thregr.org/~wavexx/software/facedetect/, for face detection)
* p7zip (http://www.7-zip.org/, for faster and higher-compression zip archiving)

On Debian/Ubuntu, you can install all the required dependencies with::

  sudo apt-get install imagemagick exiftran zip liblcms2-utils
  sudo apt-get install libimage-exiftool-perl libcpanel-json-xs-perl

To save more space in the generated galleries, we recommend installing also the
optional dependencies::

  sudo apt-get install jpegoptim pngcrush p7zip

``fcaption`` is written in Python and requires PyQT4. You can install the
required packages with::

  sudo apt-get install python-qt4

For face detection support, simply follow the `facedetect installation
instructions <https://www.thregr.org/~wavexx/software/facedetect/#dependencies>`_.

On a Mac, we recommend installing the dependencies using `MacPorts
<http://www.macports.org/>`_. After installing MacPorts, type::

  sudo port install imagemagick lcms2 jpeg jpegoptim pngcrush
  sudo port install p5-image-exiftool p5-cpanel-json-xs


Installation
------------

Installation is currently optional. If needed, copy the extracted directory to
a directory of your liking and link `fgallery` appropriately::

  sudo cp -r fgallery-X.Y /usr/local/share/fgallery
  sudo ln -s /usr/local/share/fgallery/fgallery /usr/local/bin


Authors and Copyright
---------------------

"fgallery" can be found at https://www.thregr.org/~wavexx/software/fgallery/

| "fgallery" is distributed under GPLv2+ (see COPYING) WITHOUT ANY WARRANTY.
| Copyright(c) 2011-2016 by wave++ "Yuri D'Elia" <wavexx@thregr.org>.

fgallery's GIT repository is publicly accessible at::

  git://src.thregr.org/fgallery

or at https://github.com/wavexx/fgallery


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
