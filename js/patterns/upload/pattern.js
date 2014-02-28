/* Upload pattern.
 *
 * Options:
 *    url(string): If not used with a form, this option must provide the URL to submit to (null)
 *    clickable(boolean): If you can click on container to also upload (false)
 *    className(string): value for class attribute in the form element ('upload')
 *    paramName(string): value for name attribute in the file input element ('file')
 *    uploadMultiple(boolean): condition value for multiple attribute in the file input element. If the value is 'true' and paramName is file, 'multiple=multiple' and 'name=file[]' will be added in the file input. (false)
 *    wrap(boolean): true or false for wrapping this element using the value of wrapperTemplate. If the value is 'inner', this element will wrap the wrapperTemplate value. (false)
 *    wrapperTemplate(string): HTML template for wrapping around with this element. ('<div class="upload-container"/>')
 *    resultTemplate(string): HTML template for the element that will contain file information. ('<div class="dz-notice"><p>Drop files here...</p></div><div class="upload-previews"/>')
 *    autoCleanResults(boolean): condition value for the file preview in div element to fadeout after file upload is completed. (false)
 *    previewsContainer(selector): JavaScript selector for file preview in div element. (.upload-previews)
 *
 * Documentation:
 *    # On a form element
 *
 *    {{ example-1 }}
 *
 *    # On a div element
 *
 *    {{ example-2 }}
 *
 * Example: example-1
 *    <form method="post" action="/upload" enctype="multipart/form-data"
 *          class="pat-upload" data-pat-upload="clickable:true">
 *    </form>
 *
 * Example: example-2
 *    <div class="pat-upload" data-pat-upload="url: /upload">
 *      <div>
 *        <p>Something here that is useful</p>
 *        <p>Something else here that is useful</p>
 *        <p>Another thing here that is useful</p>
 *      </div>
 *    </div>
 *
 * License:
 *    Copyright (C) 2010 Plone Foundation
 *
 *    This program is free software; you can redistribute it and/or modify it
 *    under the terms of the GNU General Public License as published by the
 *    Free Software Foundation; either version 2 of the License.
 *
 *    This program is distributed in the hope that it will be useful, but
 *    WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General
 *    Public License for more details.
 *
 *    You should have received a copy of the GNU General Public License along
 *    with this program; if not, write to the Free Software Foundation, Inc.,
 *    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
 */


define([
  'jquery',
  'underscore',
  'mockup-patterns-base',
  'mockup-patterns-relateditems',
  'dropzone',
  'text!js/patterns/upload/templates/upload_input.xml',
  'text!js/patterns/upload/templates/queue_item_dz.xml',
], function($, _, Base,
            RelatedItems, Dropzone,
            InputTemplate, QueueItemTemplate) {
  'use strict';

  /* we do not want this plugin to auto discover */
  Dropzone.autoDiscover = false;

  var UploadPattern = Base.extend({
    name: 'upload',
    defaults: {
      url: null, // XXX MUST provide url to submit to OR be in a form
      className: 'upload',
      paramName: 'file',
      uploadMultiple: false,
      clickable: false,
      wrap: false,
      addRemoveLinks: false,
      wrapperTemplate: '<div class="upload-container"/>',
      autoCleanResults: false,
      previewsContainer: '.previews',
      previewsTemplate: null,
      fileaddedClassName: 'dropping',
      useTus: false,
      maxFilesize: 99999999 // let's not have a max by default...
    },
    init: function() {
      var self = this,
          dzone_options = this.getDzoneOptions();

      self.$el.append(_.template(InputTemplate));
      var $upload_area = $('.upload-area', self.$el);

      try {
        // if init of Dropzone fails it says nothing and
        // it fails silently. Using this block we make sure
        // that if you break it w/ some weird or missing option
        // you can get a proper log of it
        self.dropzone = new Dropzone($upload_area[0], dzone_options);
      } catch(e) {
        //do stuff with the exception
        if (typeof console === "undefined" || typeof console.log === "undefined") {
            console = {};
            console.log = function(msg) {
                alert(msg);
            };
        } else {
          console.log(e);
        }
      }

      self.dropzone.on('addedfile', function(){
        console.log('file added!!');
        // show upload controls
        $('.controls', self.$el).fadeIn('slow');
        // self.$el.addClass(fileaddedClassName);
        // setTimeout(function(){
        //   if(!processing){
        //     process();
        //   }
        // }, 100);
      });

      self.dropzone.on('removedfile', function(){
        if(self.dropzone.files.length < 1){
          $('.controls', self.$el).fadeOut('slow');
        }
      });


      $(".upload-all", self.$el).click(function (e) {
          e.preventDefault();
          e.stopPropagation();
          self.dropzone.processQueue();
        }
      );
      // self.processUpload();
    },

    getDzoneOptions: function(){
      var self = this;

      // clickable option
      if(typeof(self.options.clickable) === 'string'){
        if(self.options.clickable === 'true'){
          self.options.clickable = true;
        } else {
          self.options.clickable = false;
        }
      }
      // url to submit to
      if(!self.options.url && self.$el[0].tagName === 'FORM'){
        var url = self.$el.attr('action');
        if(!url){
          // form without action, defaults to current url
          url = window.location.href;
        }
        self.options.url = url;
      }

      // test
      self.options.url = 'http://localhost:8080/Plone/@@fileUpload';

      var options = $.extend({}, self.options);
      delete options.wrap;
      delete options.wrapperTemplate;
      delete options.resultTemplate;
      delete options.autoCleanResults;
      delete options.fileaddedClassName;
      delete options.useTus;

      // XXX: do this right
      options.autoProcessQueue = false;
      options.clickable = true;
      // options.addRemoveLinks = true;  // we show them in the template
      options.previewTemplate = QueueItemTemplate;
      options.uploadMultiple = true;
      return options;
    },

    processUpload: function(){
      var self = this,
          processing = false,
          useTus = self.options.useTus,
          fileaddedClassName = self.options.fileaddedClassName;

      function process(){
        console.log('processing....');
        processing = true;
        if(self.dropzone.files.length === 0){
          processing = false;
          self.$el.removeClass(fileaddedClassName);
          return;
        }
        var file = self.dropzone.files[0];
        if ([Dropzone.SUCCESS,
            Dropzone.ERROR,
            Dropzone.CANCELED].indexOf(file.status) !== -1) {
          // remove it
          self.dropzone.removeFile(file);
          process();
        } else if (file.status !== Dropzone.UPLOADING){
          // start processing file
          if(useTus && window.tus){
            // use tus upload if installed
            self.handleTusUpload(file);
          }else{
            // otherwise, just use dropzone to process
            // XXX: do this only if auto-upload is on!
            // self.dropzone.processFile(file);
          }
          setTimeout(process, 100);
        }else{
          // currently processing
          setTimeout(process, 100);
        }
      }
      // debugger;

    },

    handleTusUpload: function(file){
      var self = this,
          $preview = $(file.previewElement),
          $progress = $preview.find('[data-dz-uploadprogress]'),
          chunkSize = 1024 * 1024 * 5; // 5mb chunk size

      file.status = Dropzone.UPLOADING;

      window.tus.upload(file, {
        endpoint: self.options.url,
        headers: {
          'FILENAME': file.name
        },
        chunkSize: chunkSize
      }).fail(function(){
        alert('Error uploading with TUS resumable uploads');
        file.status = Dropzone.ERROR;
      }).progress(function(e, bytesUploaded, bytesTotal){
        var percentage = (bytesUploaded / bytesTotal * 100);
        $progress.css('width', percentage + '%');
        $progress.parent().css('display', 'block');
        var $size = $preview.find('.dz-size');
        $size.html('uploading...<br />' +
                   self.formatBytes(bytesUploaded) +
                   ' / ' + self.formatBytes(bytesTotal));
      }).done(function(url, file){
        file.status = Dropzone.SUCCESS;
        self.dropzone.emit('success', file);
        self.dropzone.emit('complete', file);
      });
    },

    formatBytes: function(bytes){
      var kb = Math.round(bytes / 1024);
      if(kb < 1024){
        return kb + ' KiB';
      }
      var mb = Math.round(kb / 1024);
      if(mb < 1024){
        return mb + ' MB';
      }
      return Math.round(mb / 1024) + ' GB';
    },

    // items: function(){
    //   var items = [];
    //   $.each(['1','2','3','4','5'], function(){
    //     items.push({
    //       'uid': 'uid-' + this,
    //       'title': 'Title ' + this
    //     });
    //   });
    //   return items;
    // },

    // renderQueue: function(){
    //   var self = this,
    //       $container = $('.upload-queue .items', self.$el),
    //       template = _.template(QueueItemTemplate),
    //       data = {
    //         'items': self.items()
    //       };
    //   $container.append(template(data));
    //   $('.remove-item', $container).on('click', self.removeItem);
    // },

    // createRelatedItems: function(){
    //   var data = { vocabularyUrl: '/relateditems-test.json' };
    //   this.uploadPath = new RelatedItems(this.$upload_path_input,
    //                                      data);
    // },

    removeItem: function(){
      $(this).closest('.item').slideUp(800, function() { $(this).remove(); });
    }

  });

  return UploadPattern;

});
