// Frak'in gallery, by wave++ 2011
var padding = 22;
var datafile = 'data.json';

var Block = new Class(
{
  initialize: function(album, pos)
  {
    this.album = album;

    var elem = new Element('div',
    {
      'class': 'imgblock',
      styles:
      {
	'padding-left': padding / 2,
	'padding-right': padding / 2,
	width: this.album.data.thumb[0],
	height: this.album.csize.y
      }
    });

    var img = new Element('img');
    var r = Number.random(0, this.album.data.data.length - 1);
    img.src = this.album.dir + "/" + this.album.data.data[r].thumb;

    img.inject(elem);
    elem.inject(this.album.econt);
  }
});

var Album = new Class(
{
  initialize: function(elem, dir)
  {
    this.elem = elem;
    this.dir = dir;
    new Request.JSON({ url: dir + "/" + datafile, onSuccess: this.init.bind(this) }).get();
  },

  init: function(data)
  {
    this.data = data;

    this.econt = new Element('div', { 'class': 'content' });
    this.econt.inject(this.elem);

    this.etext = new Element('div',
    {
      'class': 'text',
      text: this.data.name,
      styles: { 'font-size': this.data.thumb[1] / 2 }
    });
    this.etext.inject(this.elem);

    this.csize = this.etext.getSize();
    if(this.csize.y < this.data.thumb[1])
    {
      this.csize.y = this.data.thumb[1];
      this.etext.setStyle('line-height', this.csize.y);
    }

    var bsize = padding * 1.5 + this.data.thumb[0];
    var elems = Number.floor(this.csize.x / bsize);

    this.blocks = [];
    for(var i = 0; i != elems; ++i)
      this.blocks.push(new Block(this));

    this.elem.setStyles({ width: this.csize.x, height: this.csize.y });
  }
});

function init()
{
  var emain = $('albums');

  albums.each(function(dir)
  {
    var elem = new Element('a', { 'class': 'album' });
    elem.href = dir + "/";
    elem.inject(emain);
    new Album(elem, dir);
  });
}

window.addEvent('domready', init);
