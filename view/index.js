// fgallery: a modern, minimalist javascript photo gallery
// Copyright(c) 2003-2016 by wave++ "Yuri D'Elia" <wavexx@thregr.org>
// Distributed under GPLv2+ (see COPYING) WITHOUT ANY WARRANTY.
"use strict";

var datafile = 'data.json';
var padding = 22;
var duration = 500;
var thrdelay = 1500;
var hidedelay = 3000;
var prefetch = 1;
var minupscale = 640 * 480;
var thumbrt = 16/9 - 5/3;
var cutrt = 0.15;
var capdelay = 5000;
var rdwdelay = 500;

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
var eback;	// background
var enoise;	// additive noise
var eflash;	// flashing object
var ehdr;	// header
var ecap;	// caption
var capst;      // caption status
var captm;      // caption timeout
var elist;	// thumbnail list
var fscr;	// thumbnail list scroll fx
var econt;	// picture container
var ebuff;	// picture buffer
var eleft;	// go left
var eright;	// go right
var oimg;	// old image
var eimg;	// new image
var cthumb;	// current thumbnail
var mthumb;	// thumbnail measurement cache
var eidx;	// current index
var tthr;	// throbber timeout
var imgs;	// image list
var first;	// first image
var idle;	// idle timer
var clayout;	// current layout
var csr;	// current scaling ratio
var sdir;	// scrolling direction

function resize()
{
  // best layout
  var msize = emain.getSize();
  var rt = (imgs.thumb.min[0] / imgs.thumb.min[1]);
  var maxw = msize.x - imgs.thumb.min[0] - padding;
  var maxh = msize.y * rt - imgs.thumb.min[1] - padding;
  var layout = (maxw >= maxh? 'horizontal': 'vertical');

  // calculate a good multiplier for the thumbnail size
  var m = (layout == 'horizontal'?
    (msize.x * window.devicePixelRatio * thumbrt) / imgs.thumb.min[0]:
    (msize.y * window.devicePixelRatio * thumbrt) / imgs.thumb.min[1]);
  if(m >= 1)
    m = Math.pow(2, Math.floor(Math.log(m) / Math.LN2));
  else
    m = Math.pow(2, Math.ceil(Math.log(m) / Math.LN2));
  var sr = m / window.devicePixelRatio;

  if(layout != clayout || sr != csr)
  {
    onLayoutChanged(layout, sr);
    if(cthumb) centerThumb(0);
    clayout = layout;
    csr = sr;
  }

  // resize main container
  var epos = elist.getPosition();
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
      'width': msize.x,
      'height': epos.y
    });
  }

  if(oimg) resizeMainImg(oimg);
  if(eimg) resizeMainImg(eimg);
}

function onResize()
{
  resize();
  onScroll();
}

function onLayoutChanged(layout, sr)
{
  elist.setStyle('display', 'none');

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
      'width': Math.round(maxw * sr),
      'height': Math.round(maxh * sr),
      'background-size': Math.round(crop[0] * sr) + "px " + Math.round(crop[1] * sr) + "px"
    });

    // center cropped thumbnail
    var dx = maxw - crop[0];
    var cx = size[0] * center[0] - offset[0];
    cx = Math.round(crop[0] / 2 - cx + dx / 2);
    cx = Math.max(Math.min(0, cx), dx);

    var dy = maxh - crop[1];
    var cy = size[1] * center[1] - offset[1];
    cy = Math.round(crop[1] / 2 - cy + dy / 2);
    cy = Math.max(Math.min(0, cy), dy);

    x.eimg.setStyle('background-position', Math.round(cx * sr) + 'px ' + Math.round(cy * sr) + 'px');

    // border styles
    var classes = ['cut-left', 'cut-right', 'cut-top', 'cut-bottom'];
    classes.each(function(c) { x.ethumb.removeClass(c); });

    var wx = Math.round(size[0] * cutrt);
    if((offset[0] - cx) > wx) x.ethumb.addClass('cut-left');
    if((cx - offset[0] + size[0] - maxw) > wx) x.ethumb.addClass('cut-right');

    var wy = Math.round(size[1] * cutrt);
    if((offset[1] - cy) > wy) x.ethumb.addClass('cut-top');
    if((cy - offset[1] + size[1] - maxh) > wy) x.ethumb.addClass('cut-bottom');
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

  elist.setStyle('display', 'block');

  // update measurement cache
  mthumb = {'beg': [], 'end': []};
  if(layout == 'horizontal')
  {
    var off = elist.getScrollTop();
    imgs.data.each(function(x, i)
    {
      var top = off + x.ethumb.getTop();
      var bottom = top + x.ethumb.getHeight();
      mthumb.beg.push(top);
      mthumb.end.push(bottom);
    });
  }
  else
  {
    var off = elist.getScrollLeft();
    imgs.data.each(function(x, i)
    {
      var left = off + x.ethumb.getLeft();
      var right = left + x.ethumb.getWidth();
      mthumb.beg.push(left);
      mthumb.end.push(right);
    });
  }
}

function resizeMainImg(img)
{
  var contSize = econt.getSize();
  var listSize = elist.getSize();
  var thumbWidth = (clayout == 'horizontal'? listSize.x: listSize.y);
  var data = imgs.data[img.idx].img;
  var width = data[1][0];
  var height = data[1][1];
  var imgrt = width / height;
  var pad = padding * 2;

  if(imgrt > (contSize.x / contSize.y))
  {
    img.width = Math.max(thumbWidth + pad, contSize.x - pad);
    img.height = img.width / imgrt;
  }
  else
  {
    img.height = Math.max(thumbWidth + pad, contSize.y - pad);
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
    'top': contSize.y / 2 - img.height / 2,
    'left': contSize.x / 2 - img.width / 2
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

function lowerBound(arr, v)
{
  var b = 0;
  var e = arr.length;
  while(e - b > 1)
  {
    var x = b + Math.floor((e - b) / 2);
    if(arr[x] < v)
      b = x;
    else if(arr[x] > v)
      e = x;
    else
      return x;
  }
  return b;
}

function onScroll()
{
  var beg, end;
  if(imgs.data.length < 2)
  {
    beg = 0;
    end = 1;
  }
  else
  {
    var mins, maxs;
    if(clayout == 'horizontal')
    {
      mins = elist.getScrollTop();
      maxs = mins + elist.getHeight();
    }
    else
    {
      mins = elist.getScrollLeft();
      maxs = mins + elist.getWidth();
    }
    beg = lowerBound(mthumb.beg, mins);
    end = lowerBound(mthumb.end, maxs) + 1;
    var psize = Math.max(1, Math.floor((end - beg) / 2));
    beg = Math.max(0, beg - psize);
    end = Math.min(imgs.data.length, end + psize);
  }

  for(var i = beg; i != end; ++i)
  {
    if(!imgs.data[i].thumbLoaded)
      loadThumb(i);
  }
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
  fscr = new Fx.Scroll(elist, { duration: duration });
  fscr.addEvent('complete', function()
  {
    fscr = undefined;
    onScroll();
  });
  fscr.start(x, y);
}

function umod(i, m)
{
  if(i < 0) i = m + i;
  return i % m;
}

function resetTimeout(id)
{
  if(id) clearTimeout(id)
  return null;
}

function hideCap(nodelay)
{
  captm = resetTimeout(captm);
  if(!nodelay)
    ecap.tween('opacity', 0);
  else
  {
    ecap.get('tween').cancel();
    ecap.setStyle('display', 'none');
  }
}

function showCap(nodelay)
{
  if(capst == 'never') return;
  captm = resetTimeout(captm);
  ecap.get('tween').cancel();

  if(nodelay) ecap.fade('show');
  else ecap.tween('opacity', 1);
  ecap.setStyle('display', 'block');

  if(capst != 'always')
  {
    // calculate a decent reading time
    var cap = imgs.data[ecap.eidx]['caption'];
    var words = cap[0].split(' ').length + cap[1].split(' ').length;
    var delay = Math.max(capdelay, rdwdelay * words);
    captm = hideCap.delay(delay);
  }
}

function toggleCap()
{
  if(!imgs.captions) return;

  // switch mode
  if(capst == 'normal')
    capst = 'never';
  else if(capst == 'never')
    capst = 'always';
  else
    capst = 'normal';

  // update visual state
  if(capst == 'never')
    hideCap(true);
  else if(ecap.eidx == eidx)
    showCap(true);

  // update indicator
  var img = document.id('togglecap', ehdr);
  img.src = 'cap-' + capst + '.png';
  showHdr();
}

function setupHeader()
{
  ehdr.empty();
  if(imgs.index)
  {
    var el = new Element('a', { 'title': 'Back to index', 'href': imgs.index });
    el.set('html', '<img src=\"back.png\"/>');
    ehdr.adopt(el);
  }
  if(imgs.data[eidx].file)
  {
    var file = imgs.data[eidx].file[0];
    var el = new Element('a', { 'title': 'Download image', 'href': file });
    el.set('html', '<img src=\"eye.png\"/>');
    ehdr.adopt(el);
  }
  if(imgs.download)
  {
    var el = new Element('a', { 'title': 'Download album', 'href': imgs.download });
    el.set('html', '<img src=\"download.png\"/>');
    ehdr.adopt(el);
  }
  if(imgs.captions)
  {
    var el = new Element('a', { 'title': 'Toggle captions' });
    el.setStyle('cursor', 'pointer');
    el.addEvent('click', toggleCap);
    var img = new Element('img', { 'id': 'togglecap', 'src': 'cap-' + capst + '.png' });
    img.inject(el);
    el.inject(ehdr);
  }
  if(imgs.data[eidx].date)
    ehdr.adopt(new Element('span', { 'html': '<b>Date</b>: ' + imgs.data[eidx].date }));
  ehdr.setStyle('display', (ehdr.children.length? 'block': 'none'));
}

function onMainReady()
{
  resizeMainImg(eimg);
  eimg.setStyle('opacity', 0);
  eimg.addClass('current');
  eimg.inject(ebuff);

  setupHeader();
  if(imgs.data[eidx].file)
  {
    var file = imgs.data[eidx].file[0];
    eimg.addEvent('click', function() { window.location = file; });
    eimg.setStyle('cursor', 'pointer'); // fallback
    eimg.setStyle('cursor', 'zoom-in');
  }

  // caption
  if(!imgs.data[eidx]['caption'])
    hideCap();
  else
  {
    var cap = imgs.data[eidx]['caption'];
    ecap.eidx = eidx
    ecap.empty();
    if(cap[0].length)
      ecap.adopt(new Element('div', { 'id': 'title', 'text': cap[0] }));
    if(cap[1].length)
      ecap.adopt(new Element('div', { 'id': 'desc', 'text': cap[1] }));
    showCap(first);
  }

  // disable transitions for first image
  var d = duration;
  if(first !== false)
  {
    first = false;
    d = 0;
  }

  // start animations
  if(oimg)
  {
    // scrolling direction
    var pred = umod(oimg.idx + sdir, imgs.data.length);
    if(pred != eidx)
    {
      var diff = umod(eidx - oimg.idx, imgs.data.length);
      if(diff == 1)
	sdir = 1;
      else if(diff == imgs.data.length - 1)
	sdir = -1;
      else
	sdir = 0;
    }

    // fade old image
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
  eback.src = imgs.data[eidx].blur;
  enoise.setStyle('background-position', rp + 'px ' + rp + 'px');

  tthr = resetTimeout(tthr);
  idle.start();
  showHdr();
  centerThumb(d);

  // prefetch next image
  if(prefetch && sdir != 0)
  {
    var data = imgs.data[umod(eidx + sdir, imgs.data.length)];
    Asset.images([data.img[0], data.blur]);
  }
}

function showThrobber()
{
  var img = new Element('img', { id: 'throbber' });
  img.src = "throbber.gif";
  ehdr.empty();
  img.inject(ehdr);
  ehdr.setStyle('display', 'block');
  idle.stop();
  showHdr();
}

function hideHdr()
{
  if(idle.started)
    ehdr.tween('opacity', 0);
}

function hideNav()
{
  emain.addClass('no-cursor');
  eleft.tween('opacity', 0);
  eright.tween('opacity', 0);
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
  eflash.tween('opacity', 1, 0);
}

function prev()
{
  if(eidx != 0)
    switchTo(eidx - 1);
  else
  {
    flash();
    switchTo(imgs.data.length - 1);
  }
}

function next()
{
  if(eidx != imgs.data.length - 1)
    switchTo(eidx + 1);
  else
  {
    flash();
    switchTo(0);
  }
}

function switchTo(i)
{
  window.location.replace("#" + i);
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

  resetTimeout(tthr);
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

function loadThumb(i)
{
  var x = imgs.data[i];
  x.eimg.setStyle('background-image', 'url(' + encodeURI(x.thumb[0]) + ')');
  x.thumbLoaded = true;
}

function initGallery(data)
{
  // prepare the data
  imgs = data;
  if(imgs.name) document.title = imgs.name;
  imgs.captions = false;
  capst = 'normal';
  for(var i = 0; i != imgs.data.length; ++i)
  {
    if(imgs.data[i]['caption'])
    {
      imgs.captions = true;
      break;
    }
  }

  // build the dom
  emain = $('gallery');
  emain.setStyle('display', 'none');

  eback = new Element('img', { id: 'background' });
  eback.inject(emain);

  enoise = new Element('div', { id: 'noise' });
  enoise.inject(emain);

  econt = new Element('div', { id: 'content' });
  econt.inject(emain);

  ebuff = new Element('div');
  ebuff.inject(econt);

  eflash = new Element('div', { id: 'flash' });
  eflash.setStyles({ 'opacity': 0, 'display': 'none' });
  eflash.set('tween',
  {
    duration: duration,
    link: 'cancel',
    onComplete: function() { eflash.setStyle('display', 'none'); }
  });
  eflash.inject(econt);

  ecap = new Element('div', { id: 'caption' });
  ecap.inject(econt);

  eleft = new Element('a', { id: 'left' });
  eleft.adopt((new Element('div')).adopt(new Element('img', { 'src': 'left.png' })));
  eleft.set('tween', { link: 'ignore' })
  eleft.inject(econt);

  eright = new Element('a', { id: 'right' });
  eright.adopt((new Element('div')).adopt(new Element('img', { 'src': 'right.png' })));
  eright.set('tween', { link: 'ignore' })
  eright.inject(econt);

  ehdr = new Element('div', { id: 'header' });
  ehdr.set('tween', { link: 'ignore' })
  ehdr.inject(econt);

  elist = new Element('div', { id: 'list' });
  elist.inject(emain);

  imgs.data.each(function(x, i)
  {
    var ethumb = new Element('div', { 'class': 'thumb' });
    x.ethumb = ethumb;
    x.thumbLoaded = false;

    var a = new Element('a');
    a.addEvent('click', function() { switchTo(i); });
    a.href = "#" + i;

    var img = new Element('div', { 'class': 'img' });
    x.eimg = img;
    img.inject(a);

    var ovr = new Element('div', { 'class': 'ovr' });
    ovr.inject(a);

    a.inject(ethumb);
    ethumb.inject(elist);
    elist.appendText("\n");
  });

  emain.setStyles(
  {
    'display': 'block',
    'visibility': 'hidden',
    'min-width': imgs.thumb.min[0] + padding * 2,
    'min-height': imgs.thumb.min[1] + padding * 2
  });

  // events and navigation shortcuts
  elist.addEvent('scroll', onScroll);
  eleft.addEvent('click', prev);
  eright.addEvent('click', next);
  window.addEvent('resize', onResize);
  window.addEvent('hashchange', change);

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
    else if(ev.key == 'c')
    {
      toggleCap();
    }
  });

  econt.addEvent('mousewheel', function(ev)
  {
    if(ev.alt || ev.control || ev.meta || ev.shift)
      return;

    ev.stop();
    if(ev.wheel > 0)
      prev();
    else
      next();
  });

  new MooSwipe(econt,
  {
    onSwipeleft: next,
    onSwipedown: next,
    onSwiperight: prev,
    onSwipeup: prev
  });

  // setup an idle callback for mouse movement only
  var idleTmp = new IdleTimer(window, {
    timeout: hidedelay,
    events: ['mousemove', 'mousedown', 'mousewheel']
  }).start();
  idleTmp.addEvent('idle', hideNav);
  idleTmp.addEvent('active', function() { showNav(); showHdr(); });

  // general idle callback
  idle = new IdleTimer(window, { timeout: hidedelay }).start();
  idle.addEvent('idle', hideHdr);

  // prepare first image
  sdir = 1;
  first = getLocationIndex();
  resize();
  load(first);
  loadThumb(first);
  centerThumb(0);

  emain.setStyle('visibility', 'visible');
}

function initFailure()
{
  emain = $('gallery');
  emain.set('html', "<h2>Cannot load gallery data :'(</h2>");
  emain.setStyles(
  {
    'background': 'inherit',
    'display': 'block'
  });
}

function init()
{
  if(!("devicePixelRatio" in window))
    window.devicePixelRatio = 1;

  // read the data
  new Request.JSON(
  {
    url: datafile,
    onRequest: function()
    {
      if(this.xhr.overrideMimeType)
	this.xhr.overrideMimeType('application/json');
    },
    isSuccess: function()
    {
      return (!this.status || (this.status >= 200 && this.status < 300));
    },
    onSuccess: initGallery,
    onFailure: initFailure
  }).get();

  // preload some resources
  Asset.images(['throbber.gif',
		'left.png', 'right.png',
		'eye.png', 'download.png', 'back.png',
		'cap-normal.png', 'cap-always.png', 'cap-never.png',
		'cut-left.png', 'cut-right.png',
		'cut-top.png', 'cut-mov.png']);
}

window.addEvent('domready', init);
