// fgallery: a modern, minimalist javascript photo gallery
// Copyright(c) 2003-2013 by wave++ "Yuri D'Elia" <wavexx@thregr.org>
// Distributed under GPL2 (see COPYING) WITHOUT ANY WARRANTY.
var datafile = 'data.json';
var padding = 22;
var duration = 500;
var thrdelay = 1500;
var hidedelay = 3000;
var prefetch = 1;
var minupscale = 640 * 480;
var cutrt = 0.15;

Element.Events.hashchange =
{
  onAdd: function()
  {
    var hash = window.location.hash;

    var hashchange = function()
    {
      if(hash == window.location.hash) return;
      else hash = window.location.hash;

      var value = (!hash.indexOf('#')? hash.substr(1): hash);
      window.fireEvent('hashchange', value);
      document.fireEvent('hashchange', value);
    };

    if("onhashchange" in window
    && (!Browser.ie || Browser.version > 7))
      window.onhashchange = hashchange;
    else
      hashchange.periodical(50);
  }
};

// some state variables
var emain;	// main object
var eflash;	// flashing object
var ehdr;	// header
var elist;	// thumbnail list
var fscr;	// thumbnail list scroll fx
var econt;	// picture container
var ebuff;	// picture buffer
var eleft;	// go left
var eright;	// go right
var oimg;	// old image
var eimg;	// new image
var cthumb;	// current thumbnail
var eidx;	// current index
var tthr;	// throbber timeout
var imgs;	// image list
var first;	// first image
var idle;	// idle timer
var clayout;	// current layout

function resize()
{
  var msize = emain.measure(function(){ return this.getSize(); });
  if(Browser.ie && Browser.version < 8) msize = window.getSize(); // IE<8

  var rt = (imgs.thumb.min[0] / imgs.thumb.min[1]);
  var maxw = msize.x - imgs.thumb.min[0] - padding;
  var maxh = msize.y * rt - imgs.thumb.min[1] - padding;
  var layout = (maxw >= maxh? 'horizontal': 'vertical');
  if(layout != clayout)
  {
    onLayoutChanged(layout);
    if(cthumb) centerThumb(0);
    clayout = layout;
  }

  // resize main container
  var epos = elist.measure(function(){ return this.getPosition(); });
  if(layout == 'horizontal')
  {
    econt.setStyles(
    {
      'width': epos.x,
      'height': msize.y
    });
  }
  else
  {
    econt.setStyles(
    {
      width: msize.x,
      height: epos.y
    });
  }

  if(oimg) resizeMainImg(oimg);
  if(eimg) resizeMainImg(eimg);
}

function onLayoutChanged(layout)
{
  // refit the thumbnails, cropping edges
  imgs.data.each(function(x, i)
  {
    var crop = x.thumb[1];
    var size = (x.thumb[2]? x.thumb[2]: crop);
    var offset = (x.thumb[3]? x.thumb[3]: [0, 0]);
    var center = (x.center? [x.center[0] / 1000, x.center[1] / 1000]: [0.5, 0.5]);

    var maxw, maxh;
    if(layout == 'horizontal')
    {
      maxw = imgs.thumb.min[0];
      maxh = Math.round(maxw * (crop[1] / crop[0]));
      maxh = Math.max(maxh, imgs.thumb.min[1]);
      maxh = Math.min(maxh, imgs.thumb.max[1]);
    }
    else
    {
      maxh = imgs.thumb.min[1];
      maxw = Math.round(maxh * (crop[0] / crop[1]));
      maxw = Math.max(maxw, imgs.thumb.min[0]);
      maxw = Math.min(maxw, imgs.thumb.max[0]);
    }

    x.eimg.setStyles(
    {
      'width': maxw,
      'height': maxh
    });

    // center cropped thumbnail
    var dx = maxw - crop[0];
    var cx = size[0] * center[0] - offset[0];
    cx = Math.floor(crop[0] / 2 - cx + dx / 2);
    cx = Math.max(Math.min(0, cx), dx);

    var dy = maxh - crop[1];
    var cy = size[1] * center[1] - offset[1];
    cy = Math.floor(crop[1] / 2 - cy + dy / 2);
    cy = Math.max(Math.min(0, cy), dy);

    x.eimg.setStyle('background-position', cx + 'px ' + cy + 'px');

    // border styles
    var classes = ['cut-left', 'cut-right', 'cut-top', 'cut-bottom'];
    classes.each(function(c) { x.ethumb.removeClass(c); });

    if(-(cx - offset[0]) > size[0] * cutrt) x.ethumb.addClass('cut-left');
    if((cx - offset[0] + size[0] - maxw) > size[0] * cutrt) x.ethumb.addClass('cut-right');
    if(-(cy - offset[1]) > size[1] * cutrt) x.ethumb.addClass('cut-top');
    if((cy - offset[1] + size[1] - maxh) > size[1] * cutrt) x.ethumb.addClass('cut-bottom');
  });

  // resize thumbnail list
  if(layout == 'horizontal')
  {
    elist.setStyles(
    {
      'top': 0,
      'left': 'auto',
      'right': 0,
      'bottom': 0,
      'overflow-y': 'scroll',
      'overflow-x': 'hidden',
      'white-space': 'pre-line'
    });
  }
  else
  {
    elist.setStyles(
    {
      'top': 'auto',
      'left': 0,
      'right': 0,
      'bottom': 0,
      'overflow-y': 'hidden',
      'overflow-x': 'scroll',
      'white-space': 'nowrap'
    });
  }
}

function resizeMainImg(img)
{
  var contsize = econt.getSize();
  var data = imgs.data[img.idx].img;
  var width = data[1][0];
  var height = data[1][1];
  var imgrt = width / height;
  var pad = padding * 2;

  if(imgrt > (contsize.x / contsize.y))
  {
    img.width = Math.max(imgs.thumb.max[0] + pad, contsize.x - pad);
    img.height = img.width / imgrt;
  }
  else
  {
    img.height = Math.max(imgs.thumb.max[1] + pad, contsize.y - pad);
    img.width = img.height * imgrt;
  }
  if(width * height <= minupscale && img.width > width)
  {
    img.width = width;
    img.height = height;
  }

  img.setStyles(
  {
    'position': 'absolute',
    'top': contsize.y / 2 - img.height / 2,
    'left': contsize.x / 2 - img.width / 2
  });
}

function ts()
{
  var date = new Date();
  return date.getTime();
}

function detectSlowness(start)
{
  var end = ts();
  var delta = end - start;
  if(delta > duration * 2)
    duration = 0;
}

function centerThumb(duration)
{
  var thumbPos = cthumb.getPosition();
  var thumbSize = cthumb.getSize();
  var listSize = elist.getSize();
  var listScroll = elist.getScroll();

  var x = thumbPos.x + listScroll.x - listSize.x / 2 + thumbSize.x / 2;
  var y = thumbPos.y + listScroll.y - listSize.y / 2 + thumbSize.y / 2;

  if(fscr) fscr.cancel();
  fscr = new Fx.Scroll(elist, { duration: duration }).start(x, y);
}

function onMainReady()
{
  resizeMainImg(eimg);
  eimg.setStyle('opacity', 0);
  eimg.addClass('current');
  eimg.inject(ebuff);

  // setup header
  var dsc = [];
  if(imgs.data[eidx].file)
  {
    var img = imgs.data[eidx].file[0];
    dsc.push("<a title=\"Download image\" href=\"" + encodeURI(img) + "\"><img src=\"eye.png\"/></a>");
    eimg.addEvent('click', function() { window.location = img; });
    eimg.setStyle('cursor', 'pointer'); // fallback
    eimg.setStyle('cursor', 'zoom-in');
  }
  if(imgs.download)
    dsc.push("<a title=\"Download album\" href=\"" + encodeURI(imgs.download) + "\"><img src=\"download.png\"/></a>");
  if(imgs.data[eidx].date)
    dsc.push("<b>Date</b>: " + imgs.data[eidx].date);
  ehdr.set('html', dsc.join(' '));
  ehdr.setStyle('display', (dsc.length? 'block': 'none'));

  // start animations
  var d = (first? 0: duration);
  first = false;

  if(oimg)
  {
    oimg.removeClass('current');
    var fx = oimg.get('tween');
    fx.cancel();
    fx.duration = d;
    fx.removeEvents('complete');
    fx.addEvent('complete', function(x) { x.destroy(); });
    fx.start('opacity', 0);
    oimg = undefined;
  }

  var fx = new Fx.Tween(eimg, { duration: d });
  if(d)
  {
    var now = ts();
    fx.addEvent('complete', function()
    {
      detectSlowness(now);
    });
  }
  eimg.set('tween', fx);
  fx.start('opacity', 1);

  var rp = Math.floor(Math.random() * 100);
  emain.setStyle('background-image', 'url(noise.png), url(' + encodeURI(imgs.data[eidx].blur) + ')');
  emain.setStyle('background-position', rp + 'px ' + rp + 'px, 0 0');

  clearTimeout(tthr);
  idle.start();
  showHdr();
  centerThumb(d);

  // prefetch next image
  if(prefetch && eidx != imgs.data.length - 1)
  {
    var data = imgs.data[eidx + 1];
    Asset.images([data.img[0], data.blur]);
  }
}

function showThrobber()
{
  var img = new Element('img');
  img.src = "throbber.gif";
  ehdr.empty();
  img.inject(ehdr);
  ehdr.setStyle('display', 'block');
  idle.stop();
  showHdr();
}

function hideHdr()
{
  if(idle.started && ehdr.getStyle('opacity') !== 0)
    ehdr.tween('opacity', [1, 0], { link: 'ignore' });
}

function hideNav()
{
  emain.addClass('no-cursor');
  eleft.tween('opacity', [1, 0], { link: 'ignore' });
  eright.tween('opacity', [1, 0], { link: 'ignore' });
}

function showHdr()
{
  ehdr.get('tween').cancel();
  ehdr.fade('show');
}

function showNav()
{
  emain.removeClass('no-cursor');
  eleft.get('tween').cancel();
  eleft.fade('show');
  eright.get('tween').cancel();
  eright.fade('show');
}

function flash()
{
  eflash.setStyle('display', 'block');
  eflash.tween('opacity', [1, 0]);
}

function prev()
{
  if(eidx != 0)
    window.location.hash = "#" + (eidx - 1);
  else
  {
    flash();
    window.location.hash = "#" + (imgs.data.length - 1);
  }
}

function next()
{
  if(eidx != imgs.data.length - 1)
    window.location.hash = "#" + (eidx + 1);
  else
  {
    flash();
    window.location.hash = "#0";
  }
}

function load(i)
{
  if(i == eidx) return;

  var data = imgs.data[i];
  var assets = Asset.images([data.img[0], data.blur],
  {
    onComplete: function() { if(i == eidx) onMainReady(); }
  });

  if(!oimg) oimg = eimg;
  eimg = assets[0];
  eimg.idx = eidx = i;

  if(cthumb) cthumb.removeClass('current');
  cthumb = imgs.data[eidx].ethumb;
  cthumb.addClass('current');

  clearTimeout(tthr);
  tthr = showThrobber.delay(thrdelay);
}

function getLocationIndex()
{
  var hash = window.location.hash;
  var idx = parseInt(!hash.indexOf('#')? hash.substr(1): hash);
  if(isNaN(idx) || idx < 0)
    idx = 0;
  else if(idx >= imgs.data.length)
    idx = imgs.data.length - 1;
  return idx;
}

function change()
{
  load(getLocationIndex());
}

function initGallery(data)
{
  imgs = data;
  emain = $('gallery');

  econt = new Element('div', { id: 'content' });
  econt.inject(emain);

  ebuff = new Element('div');
  ebuff.inject(econt);

  // avoid z-levels by div layering (due to IE7 ofkourse)
  var tmp;

  tmp = new Element('div');

  eflash = new Element('div', { id: 'flash' });
  eflash.setStyles({ 'opacity': 0, 'display': 'none' });
  eflash.set('tween',
  {
    duration: duration,
    link: 'cancel',
    onComplete: function() { eflash.setStyle('display', 'none'); }
  });
  eflash.inject(tmp);

  eleft = new Element('a', { id: 'left' });
  eleft.adopt((new Element('div')).adopt(new Element('img', { 'src': 'left.png' })));
  eleft.inject(tmp);

  eright = new Element('a', { id: 'right' });
  eright.adopt((new Element('div')).adopt(new Element('img', { 'src': 'right.png' })));
  eright.inject(tmp);
  tmp.inject(econt);

  tmp = new Element('div');
  ehdr = new Element('div', { id: 'header' });
  ehdr.inject(tmp);

  tmp.inject(econt);

  elist = new Element('div', { id: 'list' });
  elist.setStyles(
  {
    'padding-top': padding / 2,
    'padding-left': padding / 2
  });
  elist.inject(emain);

  imgs.data.each(function(x, i)
  {
    var ethumb = new Element('div', { 'class': 'thumb' });
    ethumb.setStyles(
    {
      'margin-bottom': padding / 2,
      'margin-right': padding / 2
    });
    x.ethumb = ethumb;

    var a = new Element('a');
    a.href = "#" + i;

    var img = new Element('div', { 'class': 'img' });
    x.eimg = img;
    img.setStyle('background-image', 'url(' + x.thumb[0] + ')');
    img.inject(a);

    var ovr = new Element('div', { 'class': 'ovr' });
    ovr.inject(a);

    a.inject(ethumb);
    ethumb.inject(elist);
    elist.appendText("\n");
  });

  // events
  eleft.addEvent('click', prev);
  eright.addEvent('click', next);
  window.addEvent('resize', resize);
  window.addEvent('hashchange', change);

  // navigation shortcuts
  window.addEvent('keydown', function(ev)
  {
    if(ev.key == 'up' || ev.key == 'left')
    {
      ev.stop();
      prev();
    }
    else if(ev.key == 'down' || ev.key == 'right' || ev.key == 'space')
    {
      ev.stop();
      next();
    }
  });

  new MooSwipe(econt,
  {
    onSwipeleft: next,
    onSwipedown: next,
    onSwiperight: prev,
    onSwipeup: prev
  });

  // first image
  first = true;
  resize();
  load(getLocationIndex());
  if(imgs.name) document.title = imgs.name;

  emain.setStyles(
  {
    'display': 'block',
    'min-width': padding * 2,
    'min-height': padding * 2,
    'background-repeat': 'repeat, no-repeat',
    'background-size': 'auto, 100% 100%'
  });

  // setup an idle callback for mouse movement only
  var idleTmp = new IdleTimer(window, { timeout: hidedelay, events: ['mousemove', 'mousedown', 'mousewheel'] }).start();
  idleTmp.addEvent('idle', hideNav);
  idleTmp.addEvent('active', function() { showNav(); showHdr(); });

  // general idle callback
  idle = new IdleTimer(window, { timeout: hidedelay }).start();
  idle.addEvent('idle', hideHdr);
}

function init()
{
  // read the data
  new Request.JSON({ url: datafile, onSuccess: initGallery }).get();

  // preload some resources
  Asset.images(['noise.png', 'left.png', 'right.png',
		'eye.png', 'download.png', 'throbber.gif',
		'cut-left.png', 'cut-right.png', 'cut-top.png',
		'cut-mov.png']);
}

window.addEvent('domready', init);
