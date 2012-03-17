/*!
 * Galrey Presentation system v1.0.0
 * http://galrey.com/
 *
 * Copyright 2010, Claudio Cicali
 * Licensed under the MIT license.
 * http://galrey.com/license
 *
 */

$(function() {
  var html='<div id="galrey_help" class="galrey_popup"><div>\
    <p><strong>Galrey Help</strong></p>\
    <p><em>H</em> / <em>ESC</em> closes this popup</p>\
    <p><em>&rarr;</em> / <em>D</em> next slide</p>\
    <p><em>&larr;</em> / <em>A</em> previous slide</p>\
    <p><em>M</em> disables/enables mouse navigation</p>\
    <p><em>spacebar</em> / <em>S</em> start/stop media (video or audio)</p>\
    <p><em>any number</em> jump to the corresponding slide</p>\
    <p><em>T</em> start/stop autoplay</p>\
  </div></div>';
  $(html).appendTo('body');
});

var Presentation = (function() {
  
  var options,
      $current = null,
      intervals = {},
      inTransition = false,
      slideCount = 0,
      $message,
      $body = $('body'),
      mouseEnabled = true,
      $numbers = null,
      $galrey,
      keyStack = '',
      $help;

  var triggerEvent = function(event, data) {
    if (event in Galrey) {
      Galrey[event].apply(this, [data]);
    }
  }
  
  var normalizeSlideNumber = function(sn) {
    if (isNaN(sn) || sn <= 0) {
      return 1;
    }
    if (sn > slideCount) {
      return slideCount;
    }
    return sn;
  }

  var closeSlide = function() {
    if ($current.length == 0) {
      return;
    }

    setMessage();
    
    var $video = $current.find('video');
    if ($video.length > 0) {
      $video.get(0).pause();
    }
    var $audio = $current.find('audio');
    if ($audio.length > 0) {
      $audio.get(0).pause();
    }
    
    triggerEvent('on_slide_close', $current.get(0));
    
  }

  var setFontSize = function() {

    var fs, w = $(window).width();
    
    switch(true) {
      case w > 1900:
        fs = '167%'; /* 22px */
        break;
      case w > 1400: 
        fs = '153.9%'; /* 20px */
        break;
      case w > 1000: /* 18px */
        fs = '138.5%';
        break;
      case w > 700: /* 16px */
        fs = '123.1%';
        break;
      default:
        fs = '93%';  /* 12px */
        break;
    }
    
    $body.css({"font-size": fs});
  }
  
  var transition = function($target, dir) {
    if ($target.length == 0) {
      if (intervals.autoplay) {
        Presentation.goTo(1);
      } else {
        setMessage(dir > 0 ? "Last slide" : "First slide");
      }
      return;
    }

    closeSlide();

    inTransition = true;

    var duration = options.transition_ms;

    if (duration > 0) {
      
      $current.css({'z-index': 101});
      $target.addClass('_current').css({'z-index': 100});
      var aniClass = '_ani-slide' + (dir > 0 ? 'Left' : 'Right');
      
      /*
      if (head.transitions) { 
        $current.css({'-webkit-animation-duration': (duration / 1000 + 's')}).addClass(aniClass);
        setTimeout(function() {
          $current.removeClass('_current ' + aniClass);
          $current = $target.addClass('_current');
          Presentation.openSlide();
        }, duration);
      }
      else {
      */
      if (options.direction == 'horizontal') {
        $current.animate({marginLeft: (dir > 0 ? '-100%' : '100%')}, duration, function() {
          $current.removeClass('_current').css({'margin-left': '0', 'z-index': 100});
          $current = $target.addClass('_current');
          Presentation.openSlide();
        });
      } else {
        $current.animate({marginTop: (dir > 0 ? '-100%' : '100%')}, duration, function() {
          $current.removeClass('_current').css({'margin-top': '0', 'z-index': 100});
          $current = $target.addClass('_current');
          Presentation.openSlide();
        });
      }
    } else {
      $current.removeClass('_current');
      $current = $target.addClass('_current');
      Presentation.openSlide();
    }
    
  }
  
  var stopAutoplay = function() {
    if (!intervals.autoplay) {
      return;
    }
    clearInterval(intervals.autoplay);
    intervals.autoplay = null;
  }

  var toggleMouse = function() {
    mouseEnabled = !mouseEnabled;
    setMessage("Mouse navigation is " + (mouseEnabled ? 'ON' : 'OFF'));
  }
  
  var toggleAutoplay = function() {

    if (intervals.autoplay) {
      stopAutoplay();
    } else {
      intervals.autoplay = setInterval(function() {
        Presentation.next();
      }, options.autoplay_ms);
    }
    
    setMessage("Autoplay is " + (intervals.autoplay ? 'ON' : 'OFF'));
  }
  
  var setMessage = function(msg, type, element) {
    var ani = type || '_ani-fadesimple';
    var $element = element || $message;
    
    if (!msg || $element.hasClass(ani)) {
      $element.stop().addClass('hidden').removeClass(ani);
      clearTimeout($element.data('interval1'));
      clearTimeout($element.data('interval2'));
      return;
    }

    $element.stop().removeClass('hidden').html("<span>" + msg + "</span>")

    var duration = options.message_ms;
    
    if (head.transitions) {
      $element.css({'-webkit-animation-duration': (duration / 1000 + 's')})
    }
    
    // FIXME found a better alghoritm
    var effectTimer = msg.length * 100;
    
    $element.data('interval1', setTimeout(function() {
      head.transitions ? $element.addClass(ani) : $element.addClass(ani).animate({'opacity': '0'}, duration, function() { $element.css({'opacity': null});});
      $element.data('interval2', setTimeout(function() {
        $element.stop().addClass('hidden').removeClass(ani);
        if (!head.transitions) {
          $element.css({'opacity': '1'});
        }
      }, duration + 10));
    }, effectTimer));
  }
  
  return {

    init: function() {

      options = {
        dimensions:    'auto',
        transition_ms: 500,
        autoplay_ms:   3000,
        autostart:     false,
        message_ms:    1000,
        numbers:       true,
        direction:     'horizontal',
        mouse_click:   'smart'
      };

      if ('options' in Galrey) {
        $.extend(options, Galrey.options);
      }
      
      if (options.direction != 'horizontal' && options.direction != 'vertical') {
        options.direction = 'horizontal';
      }

      $galrey = $('#galrey');
      
      $galrey.find("article img").lazy_load();
      
      if ('auto' != options.dimensions) {
        var dims = options.dimensions.split('x');
        $galrey.css({'width':dims[0], 'height':dims[1]});
      }
      
      $message = $('<div id="galrey_message"/>').appendTo($galrey);
      
      if (options.numbers) {
        $numbers = $('<div id="galrey_numbers"/>').appendTo($galrey);
      }
      
      $('ul.galrey_gradual :first-child, ol.galrey_gradual :first-child').addClass('galrey_visible');
      
      if (head.isTouch) {
        var touchStartX = 0;
        $(document).bind('touchstart', function(e) {
           touchStartX = e.originalEvent.touches[0].pageX;
        });
        
        $(document).bind('touchend', function(e) {
          var delta = touchStartX - e.originalEvent.changedTouches[0].pageX;
          var SWIPE_SIZE = 100;
          if (delta > SWIPE_SIZE) {
            Presentation.next();
          } else if (delta < -SWIPE_SIZE) {
            Presentation.prev();
          }
        });
      }

      $galrey.dblclick(function(e) {
        if (inTransition || !mouseEnabled) {
          return;
        }
        clearTimeout(intervals.click);
        intervals.click = null;
        Presentation.prev();
      });
      
      $galrey.click(function(e) {
          
        // Skip known "click sensible" elements
        if ('AUDIO' == e.target.nodeName ||
            'VIDEO' == e.target.nodeName ||
            'A'     == e.target.nodeName) {
          return;
        }
          
        if (inTransition || !mouseEnabled) {
          return;
        }
        
        if (window.getSelection) window.getSelection().removeAllRanges();
        else if (document.selection) document.selection.empty();
        
        if (intervals.click) {
          return;
        }
        
        intervals.click = setTimeout(function() {
          var gw = $galrey.width();
          
          switch(options.mouse_click) {
            case 'none':
              mouseEnabled = false;
              break;
              
            case 'next':
            case 'right':
              Presentation.next();
              break;
              
            case 'previous':
            case 'prev':
            case 'left':
              Presentation.prev();
              break;
              
            case 'smart':
            default:
              if (e.clientX < (gw / 2)) {
                Presentation.prev();
              } else {
                Presentation.next();
              }
              break;
          }
          intervals.click = null;
        }, 200);
        
      });

      if (!head.isTouch) {
        $(document).keydown(function(e) {

          if (inTransition) {
            return;
          }
          
          if (e.altKey || e.ctrlKey || e.shiftKey) {
            return;
          }

          triggerEvent('on_keypress', e.keyCode);
          
          if (e.keyCode != 84) {
            stopAutoplay();
          }

          if (e.keyCode > 47 && e.keyCode < 58) {
            clearTimeout(intervals.keys);
            keyStack += "" + (e.keyCode - 48);
            intervals.keys = setTimeout(function() {
              Presentation.goTo(parseInt(keyStack));
              keyStack = '';
            }, 500);
          }

          switch (e.keyCode) {
            case 72: // h
              if (!$help) {
                $help = $('#galrey_help');
                $help.popup({overlayParent: $galrey});
              }
              $help.popup('toggle');
              break;
              
            case 27: // esc
              if ($help) {
                $help.popup('close');
              }
              break;

            case 77: // t
              toggleMouse();
              break;

            case 84: // t
              toggleAutoplay();
              break;
              
            case 33: // page up
            case 38: // up
            case 65: // a
            case 37: // left arrow
              Presentation.prev();
              break;
  
            case 34: // page down
            case 40: // down
            case 68: // d
            case 39: // right arrow
              Presentation.next(); 
              break;
  
            case 83: // s
            case 32: // space
              var $video = Presentation.current().find('video');
              if ($video.length > 0) {
                var video = $video.get(0);
                video.paused ? video.play() : video.pause();
                setMessage(video.paused ? 'Paused' : 'Playing');
              }
              var $audio = Presentation.current().find('audio');
              if ($audio.length > 0) {
                var audio = $audio.get(0);
                audio.volume = 1;
                audio.paused ? audio.play() : audio.pause();
                setMessage(audio.paused ? 'Paused' : 'Playing');
              }
              break;
  
          }
        });
      }

      var $slides = $('article');
      slideCount = $slides.length;
      $slides.each(function(id) {
        $(this).addClass('galrey_slide slide-' + (id + 1)).data('sn', id + 1);
      }).length;

      $slides.find('a').click(function() {
        var sn, h = $(this).attr('href');
        if (sn = h.match(/^#slide(\d+)$/)) {
          Presentation.goTo(sn[1]);
          return false;
        }
      });
      
      return this;
    },

    start: function() {

      var h = window.location.hash, s;
      try {
        s = parseInt(h.split('#slide')[1], 10);
      } catch (e) { /* squeltch */ }

      $galrey.show();
      
      if (options.autostart) {
        toggleAutoplay();
      }
      
      if (head.browser.mozilla) {
        /* Really don't understand this bug */
        $galrey.css({'width': ($galrey.width() + 14) + "px", 'height': ($galrey.height() - 4) + "px" });
        $(window).resize(function() {
          $galrey.css({'width': '100%', 'height': '100%' });
          $galrey.css({'width': ($galrey.width() + 14) + "px", 'height': ($galrey.height() - 4) + "px"});
        });
      }

      $(window).resize(function() {
        setFontSize();
      });
      
      setFontSize();
      
      triggerEvent('on_ready');

      Presentation.goTo(s);
    },
    
    goTo: function(sn, noEvent) {
      noEvent = !!noEvent;
      if ($current && $current.length > 0) {
        $current.removeClass('_current');
      }
      $current = $('article:nth(' + (normalizeSlideNumber(sn) - 1) + ')').addClass('_current');
      this.openSlide(noEvent);
    },
    
    openSlide: function(noEvent) {
      noEvent = !!noEvent;
      inTransition = false;

      if ($current.length == 0) {
        return;
      }

      $current.find('img:not(.appeared)').trigger('appear');

      var sn = $current.data('sn');
      
      var $media = $current.find('div.galrey_media'), src, c;
      
      if ($media.length > 1 && head.transitions) {
        alert("Sorry, Webkit based browser are known to be problematic with more than one <video>/<audio> element in the page.");
        $media.remove();
      } else {
        if ($media.length > 0) {
          $media.each(function() {
            var $m = $(this);
            $m.removeClass('galrey_media');
            if (src = $m.data('video')) {
              /* Autoplay must be delegated */
              if ('' != (c = $.trim($m.get(0).className))) {
                c = 'class="' + c + '"';
              }
              $m.replaceWith('<video ' + c + ' controls><source src="' + src + '"></video>');
            }
            if (src = $m.data('audio')) {
              if ('' != (c = $.trim($m.get(0).className))) {
                c = 'class="' + c + '"';
              }
              $m.replaceWith('<audio src="' + src + '"' + c + ' controls><p>Audio element not supported</p></audio>');
            }
          });
        }
      }
      
      try {
        history.pushState(sn, 'Slide ' + sn, '#slide' + sn);
      } catch(e) {
        window.location.hash = 'slide' + sn;
      }

      if (!$current.data('gradElement')) {
        var $gradElement = $current.find('.galrey_gradual');
        if ($gradElement.length == 1) {
          $current.data('gradElement', $gradElement);
        }
      }
      
      var $video = $current.find('video.autoplay');
      if ($video.length > 0) {
        var volumeMax = $video.data('volumeMax') || 10;
        if ((volumeMax = volumeMax / 10) > 1.0) {
          volumeMax = 1;
        }
        var video = $video.get(0);
        video.volume = volumeMax;
        video.play();
        $video.removeClass('autoplay');
      }
      
      var $audio = $current.find('audio.autoplay');
      if ($audio.length > 0) {
        var volumeTime = $audio.data('volumeTime') || 5,
            volumeMax = $audio.data('volumeMax') || 10,
            volumeMin = $audio.data('volumeMin') || volumeMax;
        if ((volumeMax = volumeMax / 10) > 1.0) {
          volumeMax = 1;
        }
        if ((volumeMin = volumeMin / 10) < 0) {
          volumeMin = 0;
        }
        if (volumeMin > volumeMax) {
          volumeMin = volumeMax;
        }
        
        var audio = $audio.get(0);
        audio.volume = volumeMax;
        audio.play();
        $audio.removeClass('autoplay');
        
        var steps = (volumeMax - volumeMin) * 10;
        
        if (steps > 0) {
          
          var rate = Math.ceil(((volumeTime * 1000) / 500) / steps);
          var beats = 0;
          
          intervals.audio = setInterval(function() {
            beats++;
            if (audio.paused) {
              clearInterval(intervals.audio);
              return;
            }
            try {
              if (audio.volume > volumeMin && (beats % rate == 0)) {
                audio.volume -= .1;
              } else {
                if (audio.volume < volumeMin) {
                  clearInterval(intervals.audio);
                }
              }
            } catch(e) {
              clearInterval(intervals.audio);
            }
          }, 500);
        }
      }
      // FIXME cache
      var $title = $current.find('h1.message');
      if ($title.length > 0) {
        setMessage($title.hide().html());
      }
      if ($numbers && $numbers.length > 0) {
        setMessage(sn + " / " + slideCount, '_ani-fadesimple', $numbers);
      }
      
      if (!noEvent) {
        triggerEvent('on_slide_open', $current.get(0));
      }

    },

    current: function() {
      return $current;
    },
    
    next: function() {
      
      var $te = $current.data('gradElement');
      if ($te && $te.length == 1) {
        var $next = $te.children(':not(.galrey_visible):first');
        if ($next.length > 0) {
          $next.addClass('galrey_visible').slideDown('fast');
        } else {
          $te.removeClass('galrey_gradual');
          $current.data('gradElement', null);
          transition($current.next('article'), +1);
        }
      } else {
        transition($current.next('article'), +1);
      }
    },
    
    prev: function() {
      transition($current.prev('article'), -1);
    }
  }
  
})();

(function($) {

  $.fn.lazy_load = function() {
    this.each(function() {
      var $me = $(this);
      $me.data('src-original', $me.attr('src')).attr('src', 'galrey/themes/spinner.gif');
      $me.bind('appear', function() {
        if ($(this).hasClass('appeared')) {
          return;
        }
        $(this).attr('src', $(this).data('src-original')).addClass('appeared');
      })
    })
    return this;
  }
  
})(jQuery);

(function($) {

    var $overlay, $overlayParent, options = {};
    
    $.fn.popup = function(settings) {
        
        var cmd;
        
        //var config = {'foo': 'bar'};
        if ($.isPlainObject(settings)) {
          
          $.extend(options, settings);
        
          $overlayParent = options.overlayParent || $('body');
          
          /* Create an overlay to use as matte */
          $overlay = $('<div/>').css({
              'display': 'none',
              'background-color': '#AAA',
              'position': 'absolute',
              'top': 0,
              'left': 0,
              'opacity': '0.6',
              'z-index': '1001'
          })
          .appendTo($overlayParent)
          .click(function(e) {
            e.stopPropagation();
            e.preventDefault();
            return false;
          });
        } else {
          cmd = settings;
        }
        
        this.each(function() {
            
            var $popup = $(this);
              
            if ('open' == cmd || ('toggle' == cmd && !$popup.is(':visible'))) {
              if ($popup.is(':visible')) {
                  return;
                  //$dialog.hide();
              }
  
              $('<img class="icon" src="galrey/lib/close.png?v=1"/>')
              .prependTo($popup)
              .click(function() {
                close();
              });
              
              /* Open the popup and center it on the screen */
              $popup.css({
                  'z-index': '1002',
                  'position': 'absolute',
                  'top': $overlayParent.scrollTop() + (($overlayParent.height() - $popup.height()) / 2),
                  'left': ($overlayParent.width() - $popup.width()) / 2
              });
              
              /* Show the overlay */
              $overlay.css({'width': $overlayParent.width(),'height': $overlayParent.height()}).show();
              
              $popup.show();
              
              if ($.isFunction(options.onOpen)) {
                  options.onOpen.apply($popup);
              }
              
              return;
            }

            if ('resize' == cmd) {
              
              if (!$popup.is(':visible')) {
                return;
              }
              
              /* Need to hide the overlay first, or the document size would be fooled */
              $overlay.hide().css({'width': $(document).width(),'height': $(document).height()}).show();
              $popup.css({
                  'z-index': '1001',
                  'position': 'absolute',
                  'top': $(document).scrollTop() + (($(window).height() - $popup.height()) / 2),
                  'left': ($(window).width() - $popup.width()) / 2
              });
              
              if ($.isFunction(options.onResize)) {
                  options.onResize.apply($popup);
              }
              
              return;
            }
            
            if ('close' == cmd || ('toggle' == cmd && $popup.is(':visible'))) {
              if ($popup.is(':visible')) {
                close();
              }
              return;
            }
            
            function close() {
                $overlay.hide();
                $popup.hide();
                if ($.isFunction(options.onClose)) {
                  options.onClose.apply($popup);
                }
            }
    		});
    		
        return this;
    }
})(jQuery);

