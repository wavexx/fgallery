var padding = 22;
var duration = 500;

Element.Events.hashchange =
{
  onAdd: function()
  {
    var hash = self.location.hash;
    
    var hashchange = function()
    {
      if (hash == self.location.hash) return;
      else hash = self.location.hash;
      
      var value = (hash.indexOf('#') == 0 ? hash.substr(1) : hash);
      window.fireEvent('hashchange', value);
      document.fireEvent('hashchange', value);
    };
    
    if ("onhashchange" in window)
      window.onhashchange = hashchange;
    else
      hashchange.periodical(50);
  }
};

var ehdr;
var elist;
var econt;
var oimg;
var eimg;
var limg;
var eidx;

function resize()
{
  var ln = imgs.thumbheight + padding;
  var winsize = window.getSize();

  econt.setStyles(
  {
    width: winsize.x,
    height: winsize.y - ln
  });

  elist.setStyles(
  {
    width: winsize.x - padding,
    height: ln,
    padding: padding / 2
  });

  if(oimg) resizeMainImg(oimg);
  if(eimg) resizeMainImg(eimg);
}

function resizeMainImg(img)
{
  var contsize = econt.getSize();
  imgrt = eimg.width / eimg.height;
  if(imgrt > (contsize.x / contsize.y))
  {
    img.width = contsize.x - padding * 2;
    img.height = img.width / imgrt;
  }
  else
  {
    img.height = contsize.y - padding * 2;
    img.width = img.height * imgrt;
  }

  img.setStyles(
  {
    top: (contsize.y - eimg.height) / 2,
    left: (contsize.x - eimg.width) / 2
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
  if(delta > duration * 3)
    duration = 0;
}

function onMainReady()
{
  resizeMainImg(eimg);

  if(oimg)
  {
    var fx = new Fx.Tween(oimg, { duration: duration });
    fx.addEvent('complete', function(x) { x.destroy(); });
    fx.start('opacity', 1, 0);
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

  ehdr.set('html', imgs.data[eidx].dsc);

  var fx = new Fx.Scroll(elist, { duration: duration });
  var x = limg.getPosition().x + elist.getScroll().x;
  fx.start(x - elist.getSize().x / 2 + limg.width / 2);
}

function load(i)
{
  if(i == eidx) return;

  var data = imgs.data[i];
  var img = new Element('img');
  img.setStyle('opacity', 0);
  img.inject(econt);

  if(oimg) oimg.destroy();
  oimg = eimg;
  if(oimg) oimg.removeEvents('load');
  eimg = img;
  eidx = i;

  if(limg) limg.removeClass('current');
  limg = imgs.data[eidx].limg;
  limg.addClass('current');

  img.addEvent('load', onMainReady);
  img.src = data.img;
}

function prev()
{
  var idx = (eidx == 0? imgs.data.length - 1: idx = eidx - 1);
  window.location.hash = "#" + idx;
}

function next()
{
  var idx = (eidx == imgs.data.length - 1? 0: eidx - 1);
  window.location.hash = "#" + idx;
}

function getLocationIndex()
{
  var idx = parseInt(window.location.hash.substr(1));
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
  ehdr = $('header');
  elist = $('list');
  econt = $('content');

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

  $('left').addEvent('click', prev);
  $('right').addEvent('click', next);

  resize();
  window.addEvent('resize', resize);

  window.addEvent('hashchange', change);
  load(getLocationIndex());
}

window.addEvent('domready', init);
