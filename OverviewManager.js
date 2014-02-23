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
 *  OverviewManager
 *
 *  Defines the main manager for the overview extension.
 *  This manager keeps the overview view updated with the latest editor.
 *
 */
// ------------------------------------------------------------------------
/*global define, brackets, $, console, setTimeout */
/*jslint nomen: true, vars: true */
define(function (require, exports, module) {
    'use strict';
    
    // Load modules
    var ViewManager     = require("OverviewViewManager"),
        EditorManger    = brackets.getModule("editor/EditorManager"),
        Editor          = brackets.getModule("editor/Editor"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        
        _overviewEditor = null;
  
// ------------------------------------------------------------------------
/*
 *  HELPER FUNCTIONS
 */
// ------------------------------------------------------------------------   
    /*
     * Returns the current full editor if exists,
     * null otherwise
     */
    function _getCurrentFullEditor() {
        
        return EditorManger.getCurrentFullEditor();
    }
    
    /*
     * Sets the listeners for the overviewEditor
     */
    function _setOverviewEditorListeners() {
        $(_overviewEditor).on("cursorActivity", function (obj) {
            // If selected different line than the one already active
            if (obj.target.getCursorPos().line !== _getCurrentFullEditor().getCursorPos().line) {
                // Get new position
                var cursorPos = _overviewEditor.getCursorPos();
                
                // Set cursor to selected line and center view to position
                _getCurrentFullEditor().setCursorPos(cursorPos.line, cursorPos.ch, true, false);
        
                // Set timeout before giving focus back to master editor
                // This fixes the bug where the overviewEditor still gets the final focus
                // TODO: FIX THIS!
                setTimeout(function () {
                    _getCurrentFullEditor().focus();
                }, 100);
            }
        });
    }
    
    /*
     * Sets the given document and overview element in overviewEditor.
     * If document is null, destroy and disable overivew.
     */
    function _setOverviewEditorWithDocument(document, overview) {
        
        // If document exists
        if (document !== null && overview !== undefined) {
            
            // If overviewEdor does not exist or overvieweditor has different document
            if (_overviewEditor === null || document !== _overviewEditor.document) {
                
                // If overviewEditor exists, destroy
                if (_overviewEditor !== null) {
                    _overviewEditor.destroy();
                }
                
                // Create overview editor
                _overviewEditor = new Editor.Editor(document, false, overview.find("#code-overview-content").get(0));
                
                // Set listeners
                _setOverviewEditorListeners();
                // Enable
                ViewManager.enable();
            }
        } else if (document === null) {
            // Destroy and disable
            ViewManager.disable();
            
            // If overviewEditor exists
            if (_overviewEditor !== null) {
                _overviewEditor.destroy();
                _overviewEditor = null;
            }
        } else {
            console.error("Cannot set overview editor, document or overview do not exist");
        }
    }
    
    /*
     * Reloads the overviewEditor if needed
     */
    function _reloadOverviewEditor() {
        // Get overview and fulleditor
        var overview = ViewManager.getOverview();
        
        // If overview exists
        if (overview !== null && overview !== undefined) {
            
            var fullEditor = _getCurrentFullEditor();
            
            // If overview and fullEditor exist
            if (fullEditor !== null) {
                _setOverviewEditorWithDocument(fullEditor.document, overview);
            } else {
                console.error("Full editor does not exist!");
                _setOverviewEditorWithDocument(null, undefined);
            }
        } else {
            console.error("Overview element does not exist");
        }
    }
    
// ------------------------------------------------------------------------
/*
 *  LISTENERS FUNCTIONS
 */
// ------------------------------------------------------------------------
    
    /*
     * Sets the listeners for the viewmanager
     */
    function _setViewManagerListeners() {
        
        $(ViewManager).on("OverviewAttached", function () {
            // If currentFullEditor exists, enable
            if (_getCurrentFullEditor() !== null) {
                ViewManager.enable();
            }
        });
        
        $(ViewManager).on("ZoomApplied", function () {
            _overviewEditor.refresh();
        });
        
        $(ViewManager).on("OverviewVisible", function () {
            _reloadOverviewEditor();
        });
        
        $(ViewManager).on("OverviewHidden", function () {
            _overviewEditor.destroy();
            _overviewEditor = null;
        });
    }
    
    /*
     * Sets listener for panel manager
     */
    function _setDocumentManagerListeners() {
        
        $(DocumentManager).on("currentDocumentChange", function () {
            
            // Reload only if overviewEditor exists
            // This will handle the case where a new editor is available
            // and the case where the last editor is removed
            if (_overviewEditor !== null) {
                _reloadOverviewEditor();
            } else {
                // Else, only enable
                // The overviewEditor will be reloaded when the toolbar is clicked.
                ViewManager.enable();
            }
        });
    }
    
// ------------------------------------------------------------------------
/*
 *  API FUNCTIONS
 */
// ------------------------------------------------------------------------
    /*
     * Initializes the manager
     */
    function init() {
        // Set listeners
        _setDocumentManagerListeners();
        _setViewManagerListeners();
        
        // Initialize viewmanager
        ViewManager.init();
    }
    
    // API
    exports.init = init;
});

    