// Pattern which provide some basic form helpers:
// - prevent forms with changed values to be unloaded
// This is going to replace 'Products/CMFPlone/skins/plone_ecmascript/formUnload.js'
// Bits of this come from
// https://raw.github.com/mmonteleone/jquery.safetynet/master/jquery.safetynet.js
//
// Author: Simone Orsi
// Contact: simahawk@gmail.com
// Version: 1.0
//
// License:
//
// Copyright (C) 2013 Plone Foundation
//
// This program is free software; you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free
// Software Foundation; either version 2 of the License.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
// more details.
//
// You should have received a copy of the GNU General Public License along with
// this program; if not, write to the Free Software Foundation, Inc., 51
// Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
//


define([
  'jquery',
  'underscore',
  'mockup-patterns-base',
  'jquery.event.drag',
  'jquery.event.drop',
], function ($, _, Base) {
  "use strict";


  var DropTarget = function($el, le, direction, target){
    var self = this;
    self.$el = $el;
    self.le = le;
    self.direction = direction;
    self.pos = null;
    if(target.length !== undefined && target.length > 0){
      target = target[0];
    }
    self.target = target;

    self.init = function(){

      self.$el.addClass(self.le.getClass('droppable'));
      self.le.$el.append($el);

      var dropSelector = '.' + self.le.getClass('dropArea');
      self.$el.drop('start', function(e, dd){
        $(this).addClass(self.le.getClass('dropOver'));
      })
      .drop(function(e, dd){
        var dt = $(dd.target).data('dt');
        var $target, $row, method, $col;
        if(['top', 'bottom'].indexOf(dt.direction) !== -1){
          /* in this case, we only care about creating a new row
          * and moving the element. Everything else should be okay */
          method = dt.direction === 'top' ? 'insertBefore' : 'insertAfter';
          // add new row above
          $target = $(dt.target);
          $row = $('<div/>').addClass(self.le.options.rowClass);
          $row[method]($target);
          $col = $('<div/>').addClass(
            self.le.options.colSpanClassPrefix + self.le.options.maxColumns)
            .addClass(self.le.options.colClass)
            .append(dd.drag);
          $row.append($col);
        }else if(['toptile', 'bottomtile'].indexOf(dt.direction) !== -1){
          /* just move tile from one place to another, nothing special here */
          method = dt.direction === 'toptile' ? 'insertBefore' : 'insertAfter';
          if(dt.target !== dd.drag){
            // make sure it's not the same item
            var $tile = $(dt.target);
            $(dd.drag)[method]($tile);
          }
        }else{
          /* here, we're moving between columns so we need to split smart
          */
          method = dt.direction === 'left' ? 'insertBefore' : 'insertAfter';
          $col = $(dt.target); // target in this case is a col
          var $newCol = $('<div/>').addClass(self.le.options.colClass).append(dd.drag);
          $newCol[method]($col);
          /* for now, set all the sizes of the columns equally until
          * we can decide on a better way... */
          var $cols = $col.parent().find('.' + self.le.options.colClass);
          $cols.each(function(){
            self.le.getColumn($(this)).setSize(self.le.options.maxColumns/$cols.length);
          });
          /* add left over to first column */
          self.le.getColumn($cols.eq(0)).setSize(
              (self.le.options.maxColumns / $cols.length) +
              (self.le.options.maxColumns % $cols.length));
        }
      })
      .drop('end', function(){
        $(this).removeClass(self.le.getClass('dropOver'));
      });
      self.$el.data('dt', self);
    };

    self.setPosition = function(css){
      // we store offset because we actually check against mouse pos
      self.$el.css(css);
      var pos = self.$el.offset();
      self.pos = {
        x1: pos.left,
        x2: pos.left + self.$el.width(),
        y1: pos.top,
        y2: pos.top + self.$el.height()
      };
    };

    self.init();

    return self;
  };

  var createDropTarget = function(le, direction, target){
    return new DropTarget($('<div/>'), le, direction, target);
  };

  var Tile = function($el, le){
    var self = this;
    self.$el = $el;
    self.le = le;
    self.name = 'tile';

    self.setDropTargets = function(){
      // each tile should have a drop target above and below it
      var drop = createDropTarget(self.le, 'toptile', self.$el);
      var $drop = drop.$el.addClass(self.le.getClass('dt-tile'));
      var offset = self.$el.position();
      drop.setPosition({
        top: offset.top,
        left: offset.left,
        width: self.$el.width()
      });

      if(self.$el.is(':last-child')){
        drop = createDropTarget(self.le, 'bottomtile', self.$el);
        $drop = drop.$el.addClass(self.le.getClass('dt-tile'));
        offset = self.$el.position();
        drop.setPosition({
          top: offset.top + self.$el.height() - 20,
          left: offset.left,
          width: self.$el.width()
        });
      }
    };

    return self;
  };

  var Row = function($el, le){
    var self = this;
    self.$el = $el;
    self.le = le;

    self.setDropTargets = function(){
      var drop = createDropTarget(self.le, 'top', self.$el);
      var $drop = drop.$el.addClass(self.le.getClass('dt-row'));
      var offset = self.$el.position();
      drop.setPosition({
        top: offset.top - 10
      });
      if(self.$el.index() + 1 ===
          self.$el.parent().find('.' + self.le.options.rowClass).length){
        drop = createDropTarget(self.le, 'bottom', self.$el);
        $drop = drop.$el.addClass(self.le.getClass('dt-row'));
        offset = self.$el.position();
        drop.setPosition({
          top: offset.top + self.$el.height() + 10
        });
      }
    };
  };

  var Column = function($el, le){
    var self = this;
    self.$el = $el;
    self.le = le;

    self.getSize = function(){
      var classes = self.$el[0].className;
      classes = classes.replace(self.le.options.colSpanClassPrefix, '');
      classes = classes.replace(self.le.options.colClass, '');
      return parseInt($.trim(classes), 10);
    };

    self.setSize = function(size){
      self.$el[0].className = '';
      self.$el.addClass(self.le.options.colSpanClassPrefix + size)
        .addClass(self.le.options.colClass);
    };

    self.setDropTargets = function(){
      /* each col should have a drop target left and right */
      var drop = createDropTarget(self.le, 'left', self.$el);
      var $drop = drop.$el.addClass(self.le.getClass('dt-col'));
      var offset = self.$el.position();
      drop.setPosition({
        top: offset.top,
        left: offset.left,
        height: self.$el.height()
      });

      if(self.$el.is(':last-child')){
        drop = createDropTarget(self.le, 'right', self.$el);
        $drop = drop.$el.addClass(self.le.getClass('dt-col'));
        offset = self.$el.position();
        $drop.height(self.$el.height());
        drop.setPosition({
          top: offset.top,
          left: offset.left + self.$el.width() + $drop.width(),
          height: self.$el.height()
        });
      }
    };

    return self;
  };

    var LayoutEditor = Base.extend({
    /* XXX requirements
     * - grid css framework with div rows with class names "row"
     * - grid css framework column class prefixed by "span" with number to specify size
     * - grid css framework does 12 column width max
     *
     * maybe later we try and be more flexible...
     *
     */
    name: "layouteditor",
    defaults: {
      rowClass: 'row-fluid',
      colClass: 'col',
      colSpanClassPrefix: 'span',
      tileClass: 'tile',
      maxColumns: 12,
      tileTypes: [{
        id: 'text',
        title: 'Text'
      }],
      classes: {
        prefix: 'le-',
        active: 'active',
        drag: 'dragging',
        clone: 'drag-clone',
        dropArea: 'droppable',
        dropOver: 'drop-over',
        dropped: 'dropped',
        dragActive: 'drag-active'
      },
      initialText: 'Enter text...',
      tileSelectorTemplate: _.template(
        '<select>' +
          '<option>Add tile...</option>' +
          '<% _.each(types, function(type){ %>' +
            '<option value="<%= type.id %>"><%= type.title %></option>' +
          '<% }); %>' +
        '</select>')
    },
    init: function () {
      var self = this;
      self.$el.addClass(self.getClass('active'));
      self.setupDnD();
      self.dropTargetStepLimit = 4;
      self.dropTargetStep = 0;
      $.event.special.drop.tolerance = function(event, proxy, target){
        if($(target.elem).is(':visible')){
          return true;
        }
        return false;
      };
      self.$el.wrap($('<div/>').addClass(self.getClass('wrapper')));
      self.$wrapper = self.$el.parent();
      self.setupSelector();
    },
    setupSelector: function(){
      var self = this;
      self.$selector = $(self.options.tileSelectorTemplate({types: self.options.tileTypes}));
      self.$selector.prependTo(self.$wrapper);
      self.$selector.change(function(e){
        e.preventDefault();
        var $el = $(this);
        var val = $el.val();
        if(!val){
          return;
        }
        var tile = _.find(self.options.tileTypes, function(tile){
          if(tile.id === val){
            return true;
          }
        });
        if(tile === undefined){
          alert('could not find tile type');
        }
        self.addTile(tile);
        self.$selector.find(':selected').each(function(){
          this.selected = false;
        });
      });
    },
    addTile: function(tileType){
      var self = this;
      var $tile = $('<div>' + self.options.initialText + '</div>').addClass(self.options.tileClass);
      self.$el.find('.' + self.options.rowClass + ':last .' + self.options.colClass + ':last').append($tile);
      self.initializeTile($tile);
      self.cleanup();
      if(tileType.id === 'text'){

      }else{

      }
    },
    setDropTargetVisibility: function(e, dd, speed){
      /* we do this on every couple events to save CPU cycles
        */
      if(speed === undefined){
        speed = 'fast';
      }
      var self = this;
      self.dropTargetStep += 1;
      if(self.dropTargetStep > self.dropTargetStepLimit){
        self.dropTargetStep = 0;
        // show drop targets close and hide one away
        var padding = 4;
        var mousePos = {
          x1: e.pageX - padding,
          x2: e.pageX + padding,
          y1: e.pageY - padding,
          y2: e.pageY + padding
        };

        self.$el.find('.' + self.getClass('droppable')).each(function(){
          var $dropTarget = $(this);
          // need to make visible briefly to get position
          var dt = $dropTarget.data('dt');
          if(dt === undefined){
            return;
          }

          var pos = dt.pos;
          if(pos.x1 < mousePos.x2 && pos.x2 > mousePos.x1 &&
            pos.y1 < mousePos.y2 && pos.y2 > mousePos.y1){
            if(!$dropTarget.is(":visible")){
              $dropTarget.fadeIn(speed);
            }
          }else{
            if($dropTarget.is(':visible')){
              $dropTarget.fadeOut(speed);
            }
          }
        });
      }
    },
    initializeTile: function($el){
      var self = this;
      $el.drag('init', function(e, dd){
        /* create all drop points here */
        // we toggle this here to get the points correct and setup the
        // drop targets
        self.$el.addClass(self.getClass('dragActive'));
        self.setDropTargets();
        self.$el.addClass(self.getClass('dragActive'));
        self.dropTargetStep = 100; // here, make sure to start it
        self.setDropTargetVisibility(e, dd, 0);
      })
      .drag('start', function(e, dd) {
        var dragged = $(this);
        dragged.addClass(self.getClass('drag'));
        return dragged.clone().
          addClass(self.getClass('clone')).
          width(dragged.width()).height(dragged.height()).
          appendTo(self.$el);
      })
      .drag(function(e, dd) {
        /*jshint eqeqeq:false */
        var $proxy = $(dd.proxy);
        $proxy.css({
          top: e.pageY,
          left: e.pageX
        });
        self.setDropTargetVisibility(e, dd);
      }, {relative: true})
      .drag('end', function(e, dd) {
        var $el = $(this);
        $el.removeClass(self.getClass('drag'));
        self.$el.removeClass(self.getClass('dragActive'));
        $(dd.proxy).remove();
        self.$el.find('.' + self.getClass('droppable')).remove();
        self.$dropTargets = [];
        self.cleanup();
        self.setupColResizers();
      });
    },
    setDropTargets: function(){
      var self = this;
      var $rows = self.$el.find('.' + self.options.rowClass);
      var $drop, offset;
      self.$el.find('.' + self.options.rowClass).each(function(index){
        var row = self.getRow($(this));
        row.setDropTargets();

        row.$el.find('.' + self.options.colClass).each(function(index){
          var col = self.getColumn($(this));
          col.setDropTargets();
        });
      });
      self.$el.find('.' + self.options.tileClass).each(function(index){
        var tile = self.getTile($(this));
        tile.setDropTargets();
      });
    },
    getColumn: function($el){
      return new Column($el, this);
    },
    getRow: function($el){
      return new Row($el, this);
    },
    getTile: function($el){
      return new Tile($el, this);
    },
    cleanup: function(){
      /* clear out empty columns and empty rows */
      var self = this;
      self.$el.find('.' + self.options.rowClass).each(function(){
        var $row = $(this);
        $row.find('.' + self.options.colClass).each(function(){
          var col = self.getColumn($(this));
          if(col.$el.find('.' + self.options.tileClass).length === 0){
            var $cols = col.$el.siblings();
            col.$el.remove();
            if($cols.length > 0){
              var nextCol = self.getColumn($cols.eq(0));
              nextCol.setSize(col.getSize() + nextCol.getSize());
            }
          }
        });
      });
      // now, empty rows
      self.$el.find('.' + self.options.rowClass).each(function(){
        var $row = $(this);
        if($row.find('.' + self.options.colClass).length === 0){
          $row.remove();
        }
      });
    },
    setupColResizers: function(){
      var self = this;
      // first clear out existing...
      self.$el.find('.' + self.getClass('resizer')).remove();
      self.$el.find('.' + self.options.colClass)
          .off('dragstart').off('drag').each(function(){
        var $col = $(this);
        if($col.index() + 1 !== $col.parent().find('.' + self.options.colClass).length){
          // do not do last column
          $col.append($('<div/>').addClass(self.getClass('resizer')));
        }
      })
      .drag('start', function(ev, dd){
        dd.countPos = 1;
        dd.countNeg = 1;
        var $col = $(this);
        dd.col = self.getColumn($col);
        dd.startColSize = dd.col.getSize();
        dd.widthPerUnit = $col.width() / dd.startColSize;
      })
      .drag(function( ev, dd ){
        var $col = $(this);
        var $resize = $col.find('.' + self.getClass('resizer'));

        var colSize = dd.col.getSize();
        $resize.css({
          right: (-dd.deltaX - 5) - ( (colSize - dd.startColSize) * dd.widthPerUnit)
        });
        var nextCol;
        if(dd.deltaX > (dd.widthPerUnit * (colSize - dd.startColSize))){
          // moving to the right
          dd.col.setSize(dd.col.getSize() + 1);
          nextCol = self.getColumn($col.next());
          nextCol.setSize(nextCol.getSize() - 1);
          dd.countPos += 1;
        }else if(-(dd.deltaX) > (dd.widthPerUnit * (colSize - dd.startColSize))){
          // moving to the left
          dd.col.setSize(dd.col.getSize() - 1);
          nextCol = self.getColumn($col.next());
          nextCol.setSize(nextCol.getSize() + 1);
          dd.countNeg += 1;
        }
      }, {
        handle: '.' + self.getClass('resizer')
      })
      .drag('end', function(){
        var $resize = $(this).find('.' + self.getClass('resizer'));
        $resize.css({right: ''});
      });

      self.$el.find('.' + self.getClass('resizer')).hover(
          function(){
            $(this).css({opacity: 1});
          },
          function(){
            $(this).css({opacity: 0.2});
          }
      );
    },
    setupDnD: function(){
      var self = this;
      self.initializeTile(self.$el.find('.' + self.options.tileClass));
      self.setupColResizers();
    },
    getClass: function(name){
      var self = this;
      var className = self.options.classes[name];
      if(className === undefined){
        className = name;
      }
      return self.options.classes.prefix + className;
    }
  });

  return LayoutEditor;

});
