/*!
 * Galrey Slideshow system v1.0.0
 * http://galrey.com/
 *
 * Copyright 2010, Claudio Cicali
 * Licensed under the MIT license.
 * http://galrey.com/license
 *
 */
/* Auto include system.css, reset.css, theme default */

var Galrey = {};

(function() {
  var link = document.createElement("link");
  link.setAttribute("rel", "stylesheet");
  link.setAttribute("type", "text/css");
  var script = document.createElement("script");
  script.setAttribute("type", "text/javascript");

  var rnd = Math.random();
  
  /* Order matters (first will be last) */
  loadCSS('galrey/lib/print.css', 'print');
  loadCSS('galrey/lib/presentation.css?x=' + rnd, 'screen');
  loadCSS('galrey/lib/yui3-rfb.css?x=' + rnd, 'all');

  loadJS('galrey/lib/head.min.js', function() {
    head.feature("isTouch", function() { return 'ontouchstart' in window; });
    head.js('galrey/lib/webfont.min.js')
        .js('galrey/lib/jquery.min.js')
        .ready(function() {
          head.js('galrey/lib/presentation.js?x=' + rnd, function() {
            $('audio[autoplay], video[autoplay]').each(function() {
              this.pause();
              $(this).attr('autoplay',null).addClass('autoplay');
            });
  
            if ('fonts' in Galrey && 'WebFont' in window) {
              WebFont.load(Galrey.fonts);
            }
  
            Presentation.init()
                        .start();
          })
        });
  });
  
  function loadCSS(sheet, media) {
    var c_link = link.cloneNode(false);
    if (media) {
      c_link.setAttribute("media", media);
    }
    c_link.setAttribute("href", sheet);
    var firstLink = document.getElementsByTagName('link')[0];
    if (firstLink) {
      document.getElementsByTagName('head')[0].insertBefore(c_link, firstLink);
    }
    else {
      document.getElementsByTagName('head')[0].appendChild(c_link);
    }
  }

  function loadJS(file, callback, deferrable) {
    c_script = script.cloneNode(false);
    c_script.setAttribute("src", file);
    deferrable && c_script.setAttribute("defer", "defer");
    callback && (c_script.onload = callback);
    document.getElementsByTagName('head')[0].appendChild(c_script);
  }

})();
