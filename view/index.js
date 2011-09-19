// Frak'in gallery, by wave++ 2011
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
var eleft;	// go left
var eright;	// go right
var oimg;	// old image
var eimg;	// new image
var limg;	// current thumbnail
var eidx;	// current index
var tthr;	// throbber timeout

function resize()
{
  var msize = emain.measure(function(){ return this.getSize(); });

  elist.setStyles(
  {
    width: msize.x - padding,
    height: imgs.thumbheight + padding,
    padding: padding / 2
  });

  var epos = elist.measure(function(){ return this.getPosition(); });

  econt.setStyles(
  {
    width: msize.x,
    height: epos.y
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
  eimg.inject(emain);

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
  var x = limg.getPosition().x + elist.getScroll().x;
  fx.start(x - elist.getSize().x / 2 + limg.width / 2);
}

function showThrobber()
{
  var img = new Element('img');
  img.src = "throbber.gif";
  ehdr.empty();
  img.inject(ehdr);
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

  eleft.href = '#' + (eidx == 0? imgs.data.length - 1: eidx - 1);
  eright.href = '#' + (eidx == imgs.data.length - 1? 0: eidx + 1);

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

function init()
{
  emain = $('gallery');

  econt = new Element('div', { id: 'content' });
  econt.inject(emain);

  eleft = new Element('a', { id: 'left' });
  eleft.inject(econt);
  eright = new Element('a', { id: 'right' });
  eright.inject(econt);

  ehdr = new Element('div', { id: 'header' });
  ehdr.inject(emain);

  elist = new Element('div', { id: 'list' });
  elist.inject(emain);

  imgs.data.each(function(x, i)
  {
    var a = new Element('a');
    a.href = "#" + i;

    var img = new Element('img');
    img.setStyle('margin-right', padding / 2);
    img.src = x.thumb;
    x.limg = img;
    img.inject(a);

    a.inject(elist);
  });

  resize();
  window.addEvent('resize', resize);
  window.addEvent('hashchange', change);
  load(getLocationIndex());

  emain.setStyle('display', 'block');
}

window.addEvent('domready', init);
