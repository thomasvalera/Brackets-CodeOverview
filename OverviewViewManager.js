// ------------------------------------------------------------------------
/*
 * Copyright (c) 2014 Thomas Valera. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 *
 */
// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
/*
 *  OverviewViewManager
 *
 *  Defines the manager for the overview view.
 *  This manager handles the display of the view.
 *
 *
 *  Events fired:
 *  OverviewAttached
 *  ZoomApplied
 *  OverviewVisible
 */
// ------------------------------------------------------------------------
/*global define, brackets, Mustache, $ */
/*jslint nomen: true, vars: true */
define(function (require, exports, module) {
    'use strict';
    
    var SimpleSlider            = require("plugins/simple-slider.min"),
        
        _unrenderedOverview     = require("text!htmlContent/overview.html"),
        _unrenderedToolbarIcon  = require("text!htmlContent/toolbar.html"),
    
        masterLineHeight        = null,
        masterFontSize          = null,
        
        _renderedOverview       = null,
        _renderedToolbarIcon    = null,
        
        slider                  = null,
        zoom                    = 0.5;
    
// ------------------------------------------------------------------------
/*
 *  HELPER FUNCTIONS
 */
// ------------------------------------------------------------------------   
    
    /*
     * Triggers the given event
     */
    function _triggerEvent(event, data) {
        $(exports).triggerHandler(event, data);
    }
    
    /*
     * Returns the overview
     */
    function getOverview() {
        return $("#code-overview-wrapper");
    }
    
    /*
     * Returns the toolbar icon
     */
    function _getToolbarIcon() {
        return $("#code-overview-icon");
    }
    
// ------------------------------------------------------------------------
/*
 *  RENDER FUNCTIONS
 */
// ------------------------------------------------------------------------  
    /*
     * Returns a rendered toolbar view
     */
    function _renderToolbarIcon() {
        var view = $(Mustache.render(_unrenderedToolbarIcon));
        return view;
    }
    
    /*
     * Returns a rendered overview view
     */
    function _renderOverview() {
        var view = $(Mustache.render(_unrenderedOverview));
        return view;
    }
    
    /*
     * Sets the zoom
     */
    function _applyZoom() {
        // Get overview
        var overview = getOverview();
        
        // Get overview content
        var content = overview.find("#code-overview-content");
        
        // Get Overview's CodeMirror wrapper
        var CMWrapper = content.find(".CodeMirror-wrap").first();
        
        if (CMWrapper.length > 0) {
            // If first time zooming, use this chance to get the original values
            if (masterFontSize === null || masterLineHeight === null) {
                masterFontSize = CMWrapper.css("font-size").replace("px", "");
                masterLineHeight = CMWrapper.css("line-height").replace("px", "");
            }
            
            // Apply zoom and add px to make usable string
            var newFontSize = masterFontSize * zoom + "px",
                newLineHeight = masterLineHeight * zoom + "px";
            
            // Set properties to overview's CodeMirror
            CMWrapper.get(0).style.setProperty("font-size", newFontSize, "!important");
            CMWrapper.get(0).style.setProperty("line-height", newLineHeight, "!important");
            
            _triggerEvent("ZoomApplied", {});
        }
    }
// ------------------------------------------------------------------------
/*
 *  LISTENERS FUNCTIONS
 */
// ------------------------------------------------------------------------
    /*
     * Sets the listeners for the slider
     */
    function _setSliderListeners() {
    
        // Get overview
        var overview = getOverview();
        
        // Get slider
        slider = overview.find("#code-overview-slider");
        
        // Initialize slider
        slider.simpleSlider();
        
        // Bind on change
        slider.bind("slider:changed", function (event, data) {
          
            zoom = data.ratio;
            _applyZoom();
        });
        
    }
    
    /*
     * Sets the listeners for the toolbar icon
     */
    function _setToolbarIconListeners() {
        
        // On click on icon
        $("#code-overview-icon").click(function () {
            
            // Get overview and icon
            var overview = getOverview(),
                icon = _getToolbarIcon();
            
            if (overview !== null) {
                // If visible, hide
                if (overview.is(":visible")) {
                    overview.hide();
                } else if (icon.hasClass("enabled")) {
                    // Else if hidden and enabled
                    
                    // Show overview and reload editors
                    // NOTE: The order is important as the editor will 
                    // only attach itself to a visible overview.
                    overview.show();
                    
                    _triggerEvent("OverviewVisible", {});
                    
                    // Set default zoom
                    slider.simpleSlider("setRatio", zoom);
                    
                }
            }
        });
    }
// ------------------------------------------------------------------------
/*
 *  DISPLAY FUNCTIONS
 */
// ------------------------------------------------------------------------
    /*
     * Attaches the overview
     */
    function _attachOverview() {
        // Append overview to editor holder
        $("#editor-holder").append(_renderedOverview);
        
        // Set width to overview
        getOverview().css("width", 200);
        
        // Get width of main view
        var mainWidth = $(".main-view").first().width();
        
        // Set width to overview's content
        // This will allow an overflow of the text instead of breaking
        // it and making spurious lines in the overview
        $("#code-overview-content").css("width", mainWidth);
        
        // Set listeners
        _setSliderListeners();
        
        // Listeners for the overview are really only the click listener.
        // This is done in the OverviewManager by listening to the editor's events
        
        // Trigger event
        _triggerEvent("OverviewAttached", {});
    }
    
    /*
     * Attaches the toolbar icon
     */
    function _attachToolbarIcon() {
        // Add toolbar after live icon
        $("#main-toolbar").find("#toolbar-go-live").after(_renderedToolbarIcon);
        
        // Set listeners
        _setToolbarIconListeners();
    }

// ------------------------------------------------------------------------
/*
 * API FUNCTIONS
 */
// ------------------------------------------------------------------------
    
    /*
     * Enables the overview
     */
    function enable() {
        // Get icon
        var icon = _getToolbarIcon();

        // If disabled, enable
        if (icon.hasClass("disabled")) {
            
            icon.removeClass("disabled");
            icon.addClass("enabled");
            
        }
        _applyZoom();
    }
    
    /*
     * Disables the overview.
     * Hides it if necessary
     */
    function disable() {
        // Get icon
        var icon = _getToolbarIcon();
        
        // If enabled, disable
        if (icon.hasClass("enabled")) {
            
            icon.removeClass("enabled");
            icon.addClass("disabled");
            
            // Get overview
            var overview = getOverview();
            
            if (overview !== null) {
                // If visible, hide
                if (overview.is(":visible")) {
                    overview.hide();
                }
            }
        }
    }
    
    /*
     * Initializes the view manager.
     */
    function init() {
        
        // Render views
        _renderedOverview = _renderOverview();
        _renderedToolbarIcon = _renderToolbarIcon();
        
        // Display views
        _attachToolbarIcon();
        _attachOverview();
    }
    
    
    
    // API
    exports.init = init;
    exports.enable = enable;
    exports.disable = disable;
    exports.getOverview = getOverview;
});