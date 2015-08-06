var datafile = 'data.json';

function initOverview(data)
{
  emain = $('overview');
  data.data.each(function(x, i) {
    emain.grab(new Element('div', {
      'class': 'overview-img-div'
    }).grab(new Element('a', {
      'href': 'index.html#' + i
    }).grab(new Element('img', {
      'class': 'overview-img',
      'src': x.thumb[0]
    }))))
  });
};

function initFailure()
{
  emain = $('overview');
  emain.set('html', "<h2>Cannot load gallery data :'(</h2>");
  emain.setStyles(
  {
    'background': 'inherit',
    'display': 'block'
  });
}

window.addEvent("domready", function() {
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
    onSuccess: initOverview,
    onFailure: initFailure
  }).get();
});

