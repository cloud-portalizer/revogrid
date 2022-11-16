/*!
 * Built by Revolist
 */
import { B as BUILD, c as consoleDevInfo, p as plt, w as win, H, d as doc, N as NAMESPACE, a as promiseResolve, b as bootstrapLazy } from './index-8a604c17.js';
import { g as globalScripts } from './app-globals-7e6866ba.js';
import './themeService-ddaaa364.js';

/*
 Stencil Client Patch Browser v2.17.3 | MIT Licensed | https://stenciljs.com
 */
const getDynamicImportFunction = (namespace) => `__sc_import_${namespace.replace(/\s|-/g, '_')}`;
const patchBrowser = () => {
    // NOTE!! This fn cannot use async/await!
    if (BUILD.isDev && !BUILD.isTesting) {
        consoleDevInfo('Running in development mode.');
    }
    if (BUILD.cssVarShim) {
        // shim css vars
        plt.$cssShim$ = win.__cssshim;
    }
    if (BUILD.cloneNodeFix) {
        // opted-in to polyfill cloneNode() for slot polyfilled components
        patchCloneNodeFix(H.prototype);
    }
    if (BUILD.profile && !performance.mark) {
        // not all browsers support performance.mark/measure (Safari 10)
        // because the mark/measure APIs are designed to write entries to a buffer in the browser that does not exist,
        // simply stub the implementations out.
        // TODO(STENCIL-323): Remove this patch when support for older browsers is removed (breaking)
        // @ts-ignore
        performance.mark = performance.measure = () => {
            /*noop*/
        };
        performance.getEntriesByName = () => [];
    }
    // @ts-ignore
    const scriptElm = BUILD.scriptDataOpts || BUILD.safari10 || BUILD.dynamicImportShim
        ? Array.from(doc.querySelectorAll('script')).find((s) => new RegExp(`\/${NAMESPACE}(\\.esm)?\\.js($|\\?|#)`).test(s.src) ||
            s.getAttribute('data-stencil-namespace') === NAMESPACE)
        : null;
    const importMeta = "";
    const opts = BUILD.scriptDataOpts ? scriptElm['data-opts'] || {} : {};
    if (BUILD.safari10 && 'onbeforeload' in scriptElm && !history.scrollRestoration /* IS_ESM_BUILD */) {
        // Safari < v11 support: This IF is true if it's Safari below v11.
        // This fn cannot use async/await since Safari didn't support it until v11,
        // however, Safari 10 did support modules. Safari 10 also didn't support "nomodule",
        // so both the ESM file and nomodule file would get downloaded. Only Safari
        // has 'onbeforeload' in the script, and "history.scrollRestoration" was added
        // to Safari in v11. Return a noop then() so the async/await ESM code doesn't continue.
        // IS_ESM_BUILD is replaced at build time so this check doesn't happen in systemjs builds.
        return {
            then() {
                /* promise noop */
            },
        };
    }
    if (!BUILD.safari10 && importMeta !== '') {
        opts.resourcesUrl = new URL('.', importMeta).href;
    }
    else if (BUILD.dynamicImportShim || BUILD.safari10) {
        opts.resourcesUrl = new URL('.', new URL(scriptElm.getAttribute('data-resources-url') || scriptElm.src, win.location.href)).href;
        if (BUILD.dynamicImportShim) {
            patchDynamicImport(opts.resourcesUrl, scriptElm);
        }
        if (BUILD.dynamicImportShim && !win.customElements) {
            // module support, but no custom elements support (Old Edge)
            // @ts-ignore
            return __sc_import_revo_grid(/* webpackChunkName: "polyfills-dom" */ './dom-21bd1807.js').then(() => opts);
        }
    }
    return promiseResolve(opts);
};
const patchDynamicImport = (base, orgScriptElm) => {
    const importFunctionName = getDynamicImportFunction(NAMESPACE);
    try {
        // test if this browser supports dynamic imports
        // There is a caching issue in V8, that breaks using import() in Function
        // By generating a random string, we can workaround it
        // Check https://bugs.chromium.org/p/chromium/issues/detail?id=990810 for more info
        win[importFunctionName] = new Function('w', `return import(w);//${Math.random()}`);
    }
    catch (e) {
        // this shim is specifically for browsers that do support "esm" imports
        // however, they do NOT support "dynamic" imports
        // basically this code is for old Edge, v18 and below
        const moduleMap = new Map();
        win[importFunctionName] = (src) => {
            const url = new URL(src, base).href;
            let mod = moduleMap.get(url);
            if (!mod) {
                const script = doc.createElement('script');
                script.type = 'module';
                script.crossOrigin = orgScriptElm.crossOrigin;
                script.src = URL.createObjectURL(new Blob([`import * as m from '${url}'; window.${importFunctionName}.m = m;`], {
                    type: 'application/javascript',
                }));
                mod = new Promise((resolve) => {
                    script.onload = () => {
                        resolve(win[importFunctionName].m);
                        script.remove();
                    };
                });
                moduleMap.set(url, mod);
                doc.head.appendChild(script);
            }
            return mod;
        };
    }
};
const patchCloneNodeFix = (HTMLElementPrototype) => {
    const nativeCloneNodeFn = HTMLElementPrototype.cloneNode;
    HTMLElementPrototype.cloneNode = function (deep) {
        if (this.nodeName === 'TEMPLATE') {
            return nativeCloneNodeFn.call(this, deep);
        }
        const clonedNode = nativeCloneNodeFn.call(this, false);
        const srcChildNodes = this.childNodes;
        if (deep) {
            for (let i = 0; i < srcChildNodes.length; i++) {
                // Node.ATTRIBUTE_NODE === 2, and checking because IE11
                if (srcChildNodes[i].nodeType !== 2) {
                    clonedNode.appendChild(srcChildNodes[i].cloneNode(true));
                }
            }
        }
        return clonedNode;
    };
};

patchBrowser().then(options => {
  globalScripts();
  return bootstrapLazy([["revo-grid",[[0,"revo-grid",{"rowHeaders":[4,"row-headers"],"frameSize":[2,"frame-size"],"rowSize":[2,"row-size"],"colSize":[2,"col-size"],"range":[4],"readonly":[4],"resize":[4],"canFocus":[4,"can-focus"],"useClipboard":[4,"use-clipboard"],"columns":[16],"source":[16],"pinnedTopSource":[16],"pinnedBottomSource":[16],"rowDefinitions":[16],"editors":[16],"plugins":[16],"columnTypes":[16],"theme":[1537],"rowClass":[513,"row-class"],"autoSizeColumn":[4,"auto-size-column"],"filter":[4],"canMoveColumns":[4,"can-move-columns"],"trimmedRows":[16],"exporting":[4],"grouping":[16],"stretch":[8],"extraElements":[32],"refresh":[64],"scrollToRow":[64],"scrollToColumnIndex":[64],"scrollToColumnProp":[64],"updateColumns":[64],"addTrimmed":[64],"scrollToCoordinate":[64],"setCellEdit":[64],"registerVNode":[64],"getSource":[64],"getVisibleSource":[64],"getSourceStore":[64],"getColumnStore":[64],"updateColumnSorting":[64],"clearSorting":[64],"getColumns":[64],"clearFocus":[64],"getPlugins":[64],"getFocused":[64],"getSelectedRange":[64]},[[0,"internalRowDragStart","onRowDragStarted"],[0,"internalRowDragEnd","onRowDragEnd"],[0,"internalRowDrag","onRowDrag"],[0,"internalRowMouseMove","onRowMouseMove"],[0,"internalCellEdit","onBeforeEdit"],[0,"internalRangeDataApply","onBeforeRangeEdit"],[0,"internalSelectionChanged","onRangeChanged"],[0,"initialRowDropped","onRowDropped"],[0,"initialHeaderClick","onHeaderClick"],[0,"internalFocusCell","onCellFocus"]]]]],["revogr-clipboard",[[0,"revogr-clipboard",{"doCopy":[64]},[[4,"paste","onPaste"],[4,"copy","copyStarted"]]]]],["revogr-filter-panel",[[0,"revogr-filter-panel",{"uuid":[1537],"filterItems":[16],"filterTypes":[16],"filterNames":[16],"filterEntities":[16],"filterCaptions":[16],"disableDynamicFiltering":[4,"disable-dynamic-filtering"],"isFilterIdSet":[32],"filterId":[32],"currentFilterId":[32],"currentFilterType":[32],"changes":[32],"show":[64],"getChanges":[64]},[[5,"mousedown","onMouseDown"]]]]],["revogr-row-headers",[[0,"revogr-row-headers",{"height":[2],"dataPorts":[16],"headerProp":[16],"uiid":[1],"resize":[4],"rowHeaderColumn":[16]}]]],["revogr-edit",[[0,"revogr-edit",{"editCell":[16],"column":[16],"editor":[16]}]]],["revogr-order-editor",[[0,"revogr-order-editor",{"parent":[16],"dimensionRow":[16],"dimensionCol":[16],"dataStore":[16],"dragStart":[64],"endOrder":[64],"clearOrder":[64]},[[5,"mouseleave","onMouseOut"],[5,"mouseup","onMouseUp"]]]]],["revogr-overlay-selection",[[4,"revogr-overlay-selection",{"readonly":[4],"range":[4],"canDrag":[4,"can-drag"],"useClipboard":[4,"use-clipboard"],"selectionStore":[16],"dimensionRow":[16],"dimensionCol":[16],"dataStore":[16],"colData":[16],"lastCell":[16],"editors":[16]},[[5,"mousemove","onMouseMove"],[5,"mouseleave","onMouseOut"],[5,"mouseup","onMouseUp"],[0,"dragStartCell","onCellDrag"],[4,"keyup","onKeyUp"],[4,"keydown","onKeyDown"]]]]],["revogr-focus",[[0,"revogr-focus",{"dataStore":[16],"colData":[16],"selectionStore":[16],"dimensionRow":[16],"dimensionCol":[16]}]]],["revogr-scroll-virtual",[[0,"revogr-scroll-virtual",{"dimension":[1],"viewportStore":[16],"dimensionStore":[16],"setScroll":[64],"changeScroll":[64]}]]],["revogr-temp-range",[[0,"revogr-temp-range",{"selectionStore":[16],"dimensionRow":[16],"dimensionCol":[16]}]]],["revogr-data",[[0,"revogr-data",{"readonly":[4],"range":[4],"canDrag":[4,"can-drag"],"rowClass":[1,"row-class"],"rowSelectionStore":[16],"viewportRow":[16],"viewportCol":[16],"dimensionRow":[16],"colData":[16],"dataStore":[16]}]]],["revogr-header",[[0,"revogr-header",{"viewportCol":[16],"dimensionCol":[16],"selectionStore":[16],"parent":[1],"groups":[16],"groupingDepth":[2,"grouping-depth"],"canResize":[4,"can-resize"],"colData":[16],"columnFilter":[4,"column-filter"]}]]],["revogr-viewport-scroll",[[4,"revogr-viewport-scroll",{"contentWidth":[2,"content-width"],"contentHeight":[2,"content-height"],"setScroll":[64],"changeScroll":[64]}]]]], options);
});
