fgallery 1.5: ??/??/2014
------------------------

* Fixed crash when the input directory contains spaces.


fgallery 1.4: 28/01/2014
------------------------

* Manual copying of the template directory is no longer required.
* Fixed incorrect thumbnail size for rotated JPGs.
* Fixed encoding of the album name.


fgallery 1.3: 05/01/2014
------------------------

* Improved browser behavior of the `back` button.
* Fixed incorrect thumbnail stretch for certain image ratios.
* Fixed empty thumbnail list in old browsers without ``devicePixelRatio``.
* Fixed incorrect usage of ``pngcrush``, resulting in stray PNG output files.
* Gallery generation speedup with parallelism/multi-core support (`-j`).
* Can use ``p7zip`` when installed for faster compression.
* Perl dependency on ``Date::Parse`` removed.
* Minor/cosmetic improvements.


fgallery 1.2: 30/11/2013
------------------------

* Faster loading of large galleries.
* Automatic thumbnail scaling on small screens.
* Improved support for mobile browsers.
* Swiping support.


fgallery 1.1: 21/10/2013
------------------------

* Degrades more gracefully on IE<10.
* Gallery generation speedup.
* Improved handling of UTF-8/special file names.
* Clicking on the main image shows the full image directly (if present).
* Adapts to the current screen layout automatically (horizontal/vertical layout).
* Supports face detection for improved thumbnail generation.
* JPEG/PNG optimization as an optional post-processing step.
* Minor/cosmetic improvements.
