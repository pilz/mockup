// recurrence pattern.
//
// Author: Rok Garbas
// Contact: rok@garbas.si
// Version: 1.0
//
// Description:
//
// License:
//
// Copyright (C) 2010 Plone Foundation
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
  'mockup-patterns-base'
], function($, Base, undefined) {
  "use strict";

  var Recurrence = Base.extend({
    name: 'recurrence',
    defaults: {
      ocurrences: {
        daily: {
          rrule: 'FREQ=DAILY',
          fields: [
            'dailyinterval',
            'rangeoptions'
          ]
        },
        mondayfriday: {
          rrule: 'FREQ=WEEKLY;BYDAY=MO,FR',
          fields: [
            'rangeoptions'
          ]
        },
        weekdays: {
          rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
          fields: [
            'rangeoptions'
          ]
        },
        weekly: {
          rrule: 'FREQ=WEEKLY',
          fields: [
            'weeklyinterval',
            'weeklyweekdays',
            'rangeoptions'
          ]
        },
        monthly: {
          rrule: 'FREQ=MONTHLY',
          fields: [
            'monthlyinterval',
            'monthlyoptions',
            'rangeoptions'
          ]
        },
        yearly: {
          rrule: 'FREQ=YEARLY',
          fields: [
            'yearlyinterval',
            'yearlyoptions',
            'rangeoptions'
          ]
        }
      },
      i18n: {
        ocurrences: {
          daily: 'Daily',
          mondayfriday: 'Monday and Friday',
          weekdays: 'Weekday',
          weekly: 'Weekly',
          monthly: 'Monthly',
          yearly: 'Yearly'
        },
        trigger: 'Repeat...',
        triggerChecked: 'Repeat:'
      },
      classTriggerName: 'recurrence-trigger',
      classTriggerWrapperName: 'recurrence-trigger-wrapper',
      classOcurrencesWrapperName: 'recurrence-ocurrences-wrapper',
      classOcurrenceWrapperName: 'recurrence-ocurrence-wrapper',
      classWrapperName: 'recurrence-wrapper'
    },
    init: function() {
      var self = this;

      // continue only in case pattern is initialized on textarea element
      if (!$.nodeName(self.$el[0], 'textarea')) {
        return;
      }

      // hide original element
      self.$el.hide();

      // trigger element(s)
      self.$trigger = $('<input/>')
        .attr('type', 'checkbox')
        .addClass(self.options.classTriggerName)
        .on('change', function(e) {
          if ($(e.target).attr('checked') === 'checked') {
            self.triggerChecked.call(self);
          }
        });
      self.$triggerLabel = $('<label/>')
        .text(self.options.labelTrigger);
      self.$triggerWrapper = $('<div/>')
        .append(self.$trigger)
        .append(self.$triggerLabel);

      // ocurrents element(s)
      self.$ocurrencesWrapper = $('<div/>');
      self.ocurrences = {};
      $.each(self.options.ocurrences, function(i, ocurrence) {
        // TODO: i stopped here 
      });



      // wrapper element
      self.$wrapper = $('<div/>')
        .addClass(self.options.classWrapperName)
        .append(self.$triggerWrapper)
        .append(self.$recurrenceWrapper)
        .insertBefore(self.$el);

      // populate widget
      if (this.$el.val()) {
        self.$repeat.attr('checked', true);
      }
    },
    triggerChecked: function() {
      var self = this;

      // TODO: populate recurrence elements

    }
  });

  return Recurrence;

});
