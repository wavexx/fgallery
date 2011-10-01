// Frak'in gallery, by wave++ 2011
var datafile = 'data.json';
var padding = 22;
var duration = 500;
var thrdelay = 1500;

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
var ehdr;	// header
var elist;	// thumbnail list
var econt;	// picture container
var ebuff;	// picture buffer
var eleft;	// go left
var eright;	// go right
var oimg;	// old image
var eimg;	// new image
var limg;	// current thumbnail
var eidx;	// current index
var tthr;	// throbber timeout
var imgs;	// image list

function resize()
{
  var msize = emain.measure(function(){ return this.getSize(); });
  if(Browser.ie && Browser.version < 8) msize = window.getSize();
  elist.setStyles(
  {
    width: imgs.thumb[0] + padding,
    height: msize.y - padding,
    padding: padding / 2
  });

  var epos = elist.measure(function(){ return this.getPosition(); });
  econt.setStyles(
  {
    width: epos.x,
    height: msize.y
  });

  if(oimg) resizeMainImg(oimg);
  if(eimg) resizeMainImg(eimg);
}

function resizeMainImg(img)
{
  var contsize = econt.getSize();
  var imgrt = img.width / img.height;
  if(imgrt > (contsize.x / contsize.y))
  {
    img.width = contsize.x - padding * 2;
    img.height = img.width / imgrt;
  }
  else
  {
    img.set('height', contsize.y - padding * 2);
    img.set('width', img.height * imgrt);
  }

  img.setStyles(
  {
    position: 'absolute',
    top: (contsize.y - img.height) / 2,
    left: (contsize.x - img.width) / 2
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

function onMainReady()
{
  resizeMainImg(eimg);
  eimg.setStyle('opacity', 0);
  eimg.inject(ebuff);

  if(oimg)
  {
    var fx = new Fx.Tween(oimg, { duration: duration });
    fx.addEvent('complete', function(x) { x.destroy(); });
    fx.start('opacity', 1, 0);
    oimg = undefined;
  }

  var fx = new Fx.Tween(eimg, { duration: duration });
  if(duration)
  {
    var now = ts();
    fx.addEvent('complete', function()
    {
      detectSlowness(now);
    });
  }
  fx.start('opacity', 0, 1);

  clearTimeout(tthr);
  ehdr.set('html', imgs.data[eidx].dsc);

  var fx = new Fx.Scroll(elist, { duration: duration });
  var y = limg.getPosition().y + elist.getScroll().y;
  fx.start(0, y - elist.getSize().y / 2 + limg.height / 2);
}

function showThrobber()
{
  var img = new Element('img');
  img.src = "throbber.gif";
  ehdr.empty();
  img.inject(ehdr);
}

function prev()
{
  if(eidx != 0)
    window.location.hash = "#" + (eidx - 1);
  else
  {
    emain.highlight('#fff');
    window.location.hash = "#" + (imgs.data.length - 1);
  }
}

function next()
{
  if(eidx != imgs.data.length - 1)
    window.location.hash = "#" + (eidx + 1);
  else
  {
    emain.highlight('#fff');
    window.location.hash = "#0";
  }
}

function load(i)
{
  if(i == eidx) return;

  var data = imgs.data[i];
  var img = Asset.image(data.img,
  {
    display: 'none',
    onLoad: onMainReady
  });

  if(!oimg) oimg = eimg;
  eimg = img;
  eidx = i;

  if(limg) limg.removeClass('current');
  limg = imgs.data[eidx].limg;
  limg.addClass('current');

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
  eleft = new Element('a', { id: 'left' });
  eleft.inject(tmp);
  eright = new Element('a', { id: 'right' });
  eright.inject(tmp);
  tmp.inject(econt);

  tmp = new Element('div');
  ehdr = new Element('div', { id: 'header' });
  ehdr.inject(tmp);
  tmp.inject(econt);

  elist = new Element('div', { id: 'list' });
  elist.inject(emain);

  imgs.data.each(function(x, i)
  {
    var a = new Element('a');
    a.href = "#" + i;

    var img = new Element('img');
    img.setStyle('margin-bottom', padding / 2);
    img.src = x.thumb;
    x.limg = img;
    img.inject(a);

    a.inject(elist);
  });

  resize();
  eleft.addEvent('click', prev);
  eright.addEvent('click', next);
  window.addEvent('resize', resize);
  window.addEvent('hashchange', change);
  load(getLocationIndex());

  emain.setStyles(
  {
    'display': 'block',
    'min-width': padding * 2,
    'min-height': padding * 2
  });
}

function init()
{
  new Request.JSON({ url: datafile, onSuccess: initGallery }).get();
}

window.addEvent('domready', init);
