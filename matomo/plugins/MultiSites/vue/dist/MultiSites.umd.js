(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("CoreHome"), require("vue"));
	else if(typeof define === 'function' && define.amd)
		define(["CoreHome", ], factory);
	else if(typeof exports === 'object')
		exports["MultiSites"] = factory(require("CoreHome"), require("vue"));
	else
		root["MultiSites"] = factory(root["CoreHome"], root["Vue"]);
})((typeof self !== 'undefined' ? self : this), function(__WEBPACK_EXTERNAL_MODULE__19dc__, __WEBPACK_EXTERNAL_MODULE__8bbf__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "plugins/MultiSites/vue/dist/";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "fae3");
/******/ })
/************************************************************************/
/******/ ({

/***/ "19dc":
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE__19dc__;

/***/ }),

/***/ "8bbf":
/***/ (function(module, exports) {

module.exports = __WEBPACK_EXTERNAL_MODULE__8bbf__;

/***/ }),

/***/ "fae3":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, "AllWebsitesDashboard", function() { return /* reexport */ AllWebsitesDashboard; });

// CONCATENATED MODULE: ./node_modules/@vue/cli-service/lib/commands/build/setPublicPath.js
// This file is imported into lib/wc client bundles.

if (typeof window !== 'undefined') {
  var currentScript = window.document.currentScript
  if (false) { var getCurrentScript; }

  var src = currentScript && currentScript.src.match(/(.+\/)[^/]+\.js(\?.*)?$/)
  if (src) {
    __webpack_require__.p = src[1] // eslint-disable-line
  }
}

// Indicate to webpack that this file can be concatenated
/* harmony default export */ var setPublicPath = (null);

// EXTERNAL MODULE: external {"commonjs":"vue","commonjs2":"vue","root":"Vue"}
var external_commonjs_vue_commonjs2_vue_root_Vue_ = __webpack_require__("8bbf");

// CONCATENATED MODULE: ./node_modules/@vue/cli-plugin-babel/node_modules/cache-loader/dist/cjs.js??ref--12-0!./node_modules/@vue/cli-plugin-babel/node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/@vue/cli-service/node_modules/vue-loader-v16/dist/templateLoader.js??ref--6!./node_modules/@vue/cli-service/node_modules/cache-loader/dist/cjs.js??ref--0-0!./node_modules/@vue/cli-service/node_modules/vue-loader-v16/dist??ref--0-1!./plugins/MultiSites/vue/src/AllWebsitesDashboard/AllWebsitesDashboard.vue?vue&type=template&id=1f5a5e3b

var _hoisted_1 = {
  class: "dashboardHeader"
};
var _hoisted_2 = {
  class: "card-title"
};
var _hoisted_3 = {
  key: 0
};
var _hoisted_4 = {
  class: "notification system notification-error"
};

var _hoisted_5 = /*#__PURE__*/Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("br", null, null, -1);

var _hoisted_6 = /*#__PURE__*/Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("br", null, null, -1);

var _hoisted_7 = ["href"];

var _hoisted_8 = /*#__PURE__*/Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createTextVNode"])(" – ");

var _hoisted_9 = ["href"];

var _hoisted_10 = /*#__PURE__*/Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createTextVNode"])(" – ");

var _hoisted_11 = ["href"];

var _hoisted_12 = /*#__PURE__*/Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createTextVNode"])(". ");

var _hoisted_13 = {
  class: "dashboardControls"
};
var _hoisted_14 = {
  class: "siteSearch"
};
var _hoisted_15 = ["placeholder"];
var _hoisted_16 = ["title"];
var _hoisted_17 = ["href"];
function render(_ctx, _cache, $props, $setup, $data, $options) {
  var _component_EnrichedHeadline = Object(external_commonjs_vue_commonjs2_vue_root_Vue_["resolveComponent"])("EnrichedHeadline");

  var _component_KPICardContainer = Object(external_commonjs_vue_commonjs2_vue_root_Vue_["resolveComponent"])("KPICardContainer");

  var _component_SitesTable = Object(external_commonjs_vue_commonjs2_vue_root_Vue_["resolveComponent"])("SitesTable");

  return Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])(external_commonjs_vue_commonjs2_vue_root_Vue_["Fragment"], null, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("div", _hoisted_1, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("h1", _hoisted_2, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createVNode"])(_component_EnrichedHeadline, {
    "feature-name": _ctx.translate('MultiSites_AllWebsitesDashboardTitle')
  }, {
    default: Object(external_commonjs_vue_commonjs2_vue_root_Vue_["withCtx"])(function () {
      return [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createTextVNode"])(Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate('MultiSites_AllWebsitesDashboardTitle')), 1)];
    }),
    _: 1
  }, 8, ["feature-name"])])]), _ctx.errorLoading ? (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("div", _hoisted_3, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("div", _hoisted_4, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createTextVNode"])(Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate('MultiSites_AllWebsitesDashboardErrorMessage')) + " ", 1), _hoisted_5, _hoisted_6, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createTextVNode"])(" " + Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate('General_NeedMoreHelp', '', '')) + " ", 1), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("a", {
    rel: "noreferrer noopener",
    target: "_blank",
    href: _ctx.externalRawLink('https://matomo.org/faq/troubleshooting/faq_19489/')
  }, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate('General_Faq')), 9, _hoisted_7), _hoisted_8, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("a", {
    rel: "noreferrer noopener",
    target: "_blank",
    href: _ctx.externalRawLink('https://forum.matomo.org/')
  }, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate('Feedback_CommunityHelp')), 9, _hoisted_9), _hoisted_10, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("a", {
    rel: "noreferrer noopener",
    target: "_blank",
    href: _ctx.externalRawLink('https://matomo.org/support-plans/')
  }, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate('Feedback_ProfessionalHelp')), 9, _hoisted_11), _hoisted_12])])) : Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createCommentVNode"])("", true), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createVNode"])(_component_KPICardContainer, {
    "is-loading": _ctx.isLoadingKPIs,
    "model-value": _ctx.kpis
  }, null, 8, ["is-loading", "model-value"]), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("div", _hoisted_13, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("div", _hoisted_14, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["withDirectives"])(Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("input", {
    type: "text",
    onKeydown: _cache[0] || (_cache[0] = Object(external_commonjs_vue_commonjs2_vue_root_Vue_["withKeys"])(function ($event) {
      return _ctx.searchSite(_ctx.searchTerm);
    }, ["enter"])),
    "onUpdate:modelValue": _cache[1] || (_cache[1] = function ($event) {
      return _ctx.searchTerm = $event;
    }),
    placeholder: _ctx.translate('Actions_SubmenuSitesearch')
  }, null, 40, _hoisted_15), [[external_commonjs_vue_commonjs2_vue_root_Vue_["vModelText"], _ctx.searchTerm]]), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("span", {
    class: "icon-search",
    onClick: _cache[2] || (_cache[2] = function ($event) {
      return _ctx.searchSite(_ctx.searchTerm);
    }),
    title: _ctx.translate('General_ClickToSearch')
  }, null, 8, _hoisted_16)]), !_ctx.isWidgetized && _ctx.isUserAllowedToAddSite ? (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("a", {
    key: 0,
    class: "btn",
    href: _ctx.addSiteUrl
  }, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate('SitesManager_AddSite')), 9, _hoisted_17)) : Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createCommentVNode"])("", true)]), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createVNode"])(_component_SitesTable, {
    "display-revenue": _ctx.displayRevenue,
    "display-sparklines": _ctx.displaySparklines
  }, null, 8, ["display-revenue", "display-sparklines"])], 64);
}
// CONCATENATED MODULE: ./plugins/MultiSites/vue/src/AllWebsitesDashboard/AllWebsitesDashboard.vue?vue&type=template&id=1f5a5e3b

// EXTERNAL MODULE: external "CoreHome"
var external_CoreHome_ = __webpack_require__("19dc");

// CONCATENATED MODULE: ./plugins/MultiSites/vue/src/AllWebsitesDashboard/AllWebsitesDashboard.store.ts
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/*!
 * Matomo - free/libre analytics platform
 *
 * @link    https://matomo.org
 * @license https://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */


var DEFAULT_SORT_ORDER = 'desc';
var DEFAULT_SORT_COLUMN = 'nb_visits';

var AllWebsitesDashboard_store_DashboardStore = /*#__PURE__*/function () {
  function DashboardStore() {
    var _this = this;

    _classCallCheck(this, DashboardStore);

    _defineProperty(this, "fetchAbort", null);

    _defineProperty(this, "privateState", Object(external_commonjs_vue_commonjs2_vue_root_Vue_["reactive"])({
      dashboardKPIs: {
        badges: {},
        evolutionPeriod: 'day',
        hits: '?',
        hitsCompact: '?',
        hitsEvolution: '',
        hitsTrend: 0,
        pageviews: '?',
        pageviewsCompact: '?',
        pageviewsEvolution: '',
        pageviewsTrend: 0,
        revenue: '?',
        revenueCompact: '?',
        revenueEvolution: '',
        revenueTrend: 0,
        visits: '?',
        visitsCompact: '?',
        visitsEvolution: '',
        visitsTrend: 0
      },
      dashboardSites: [],
      errorLoading: false,
      isLoadingKPIs: false,
      isLoadingSites: false,
      numSites: 0,
      paginationCurrentPage: 0,
      sortColumn: DEFAULT_SORT_COLUMN,
      sortOrder: DEFAULT_SORT_ORDER
    }));

    _defineProperty(this, "autoRefreshInterval", 0);

    _defineProperty(this, "autoRefreshTimeout", null);

    _defineProperty(this, "pageSize", 25);

    _defineProperty(this, "searchTerm", '');

    _defineProperty(this, "state", Object(external_commonjs_vue_commonjs2_vue_root_Vue_["computed"])(function () {
      return Object(external_commonjs_vue_commonjs2_vue_root_Vue_["readonly"])(_this.privateState);
    }));

    _defineProperty(this, "numberOfPages", Object(external_commonjs_vue_commonjs2_vue_root_Vue_["computed"])(function () {
      return Math.ceil(_this.state.value.numSites / _this.pageSize - 1);
    }));

    _defineProperty(this, "currentPagingOffset", Object(external_commonjs_vue_commonjs2_vue_root_Vue_["computed"])(function () {
      return Math.ceil(_this.state.value.paginationCurrentPage * _this.pageSize);
    }));

    _defineProperty(this, "paginationLowerBound", Object(external_commonjs_vue_commonjs2_vue_root_Vue_["computed"])(function () {
      if (_this.state.value.numSites === 0) {
        return 0;
      }

      return 1 + _this.currentPagingOffset.value;
    }));

    _defineProperty(this, "paginationUpperBound", Object(external_commonjs_vue_commonjs2_vue_root_Vue_["computed"])(function () {
      if (_this.state.value.numSites === 0) {
        return 0;
      }

      var end = _this.pageSize + _this.currentPagingOffset.value;
      var max = _this.state.value.numSites;

      if (end < max) {
        return end;
      }

      return max;
    }));
  }

  _createClass(DashboardStore, [{
    key: "reloadDashboard",
    value: function reloadDashboard() {
      this.privateState.sortColumn = DEFAULT_SORT_COLUMN;
      this.privateState.sortOrder = DEFAULT_SORT_ORDER;
      this.privateState.paginationCurrentPage = 0;
      this.refreshData();
    }
  }, {
    key: "navigateNextPage",
    value: function navigateNextPage() {
      if (this.privateState.paginationCurrentPage === this.numberOfPages.value) {
        return;
      }

      this.privateState.paginationCurrentPage += 1;
      this.refreshData(true);
    }
  }, {
    key: "navigatePreviousPage",
    value: function navigatePreviousPage() {
      if (this.privateState.paginationCurrentPage === 0) {
        return;
      }

      this.privateState.paginationCurrentPage -= 1;
      this.refreshData(true);
    }
  }, {
    key: "searchSite",
    value: function searchSite(term) {
      this.searchTerm = term;
      this.privateState.paginationCurrentPage = 0;
      this.refreshData(true);
    }
  }, {
    key: "setAutoRefreshInterval",
    value: function setAutoRefreshInterval(interval) {
      this.autoRefreshInterval = interval;
    }
  }, {
    key: "setPageSize",
    value: function setPageSize(size) {
      this.pageSize = size;
    }
  }, {
    key: "sortBy",
    value: function sortBy(column) {
      if (this.privateState.sortColumn === column) {
        this.privateState.sortOrder = this.privateState.sortOrder === 'desc' ? 'asc' : 'desc';
      } else {
        this.privateState.sortOrder = column === 'label' ? 'asc' : 'desc';
      }

      this.privateState.sortColumn = column;
      this.refreshData(true);
    }
  }, {
    key: "cancelAutoRefresh",
    value: function cancelAutoRefresh() {
      if (!this.autoRefreshTimeout) {
        return;
      }

      clearTimeout(this.autoRefreshTimeout);
      this.autoRefreshTimeout = null;
    }
  }, {
    key: "refreshData",
    value: function refreshData() {
      var _this2 = this;

      var onlySites = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      if (this.fetchAbort) {
        this.fetchAbort.abort();
        this.fetchAbort = null;
        this.cancelAutoRefresh();
      }

      this.fetchAbort = new AbortController();
      this.privateState.errorLoading = false;
      this.privateState.isLoadingKPIs = !onlySites;
      this.privateState.isLoadingSites = true;
      var params = {
        method: 'MultiSites.getAllWithGroups',
        filter_limit: this.pageSize,
        filter_offset: this.currentPagingOffset.value,
        filter_sort_column: this.privateState.sortColumn,
        filter_sort_order: this.privateState.sortOrder,
        format_metrics: 0,
        showColumns: ['hits_evolution', 'hits_evolution_trend', 'label', 'hits', 'nb_pageviews', 'nb_visits', 'pageviews_evolution', 'pageviews_evolution_trend', 'revenue', 'revenue_evolution', 'revenue_evolution_trend', 'visits_evolution', 'visits_evolution_trend'].join(',')
      };

      if (this.searchTerm) {
        params.pattern = this.searchTerm;
      }

      return external_CoreHome_["AjaxHelper"].fetch(params, {
        abortController: this.fetchAbort,
        createErrorNotification: false
      }).then(function (response) {
        if (!onlySites) {
          _this2.updateDashboardKPIs(response);

          external_CoreHome_["Matomo"].postEvent('MultiSites.DashboardKPIs.updated', {
            parameters: new external_CoreHome_["AjaxHelper"]().mixinDefaultGetParams({
              filter_limit: _this2.pageSize,
              filter_offset: _this2.currentPagingOffset.value,
              filter_sort_column: _this2.privateState.sortColumn,
              filter_sort_order: _this2.privateState.sortOrder,
              pattern: _this2.searchTerm
            }),
            kpis: _this2.privateState.dashboardKPIs
          });
        }

        _this2.updateDashboardSites(response);
      }).catch(function () {
        _this2.privateState.dashboardSites = [];
        _this2.privateState.errorLoading = true;
      }).finally(function () {
        _this2.privateState.isLoadingKPIs = false;
        _this2.privateState.isLoadingSites = false;
        _this2.fetchAbort = null;

        _this2.startAutoRefresh();
      });
    }
  }, {
    key: "startAutoRefresh",
    value: function startAutoRefresh() {
      var _this3 = this;

      this.cancelAutoRefresh();

      if (this.autoRefreshInterval <= 0) {
        return;
      }

      var currentPeriod;

      try {
        currentPeriod = external_CoreHome_["Periods"].parse(external_CoreHome_["Matomo"].period, external_CoreHome_["Matomo"].currentDateString);
      } catch (e) {// gracefully ignore period parsing errors
      }

      if (!currentPeriod || !currentPeriod.containsToday()) {
        return;
      }

      this.autoRefreshTimeout = setTimeout(function () {
        _this3.autoRefreshTimeout = null;

        _this3.refreshData();
      }, this.autoRefreshInterval * 1000);
    }
  }, {
    key: "updateDashboardKPIs",
    value: function updateDashboardKPIs(response) {
      this.privateState.dashboardKPIs = {
        badges: {
          hits: null,
          pageviews: null,
          revenue: null,
          visits: null
        },
        evolutionPeriod: external_CoreHome_["Matomo"].period,
        hits: external_CoreHome_["NumberFormatter"].formatNumber(response.totals.hits),
        hitsCompact: external_CoreHome_["NumberFormatter"].formatNumberCompact(response.totals.hits),
        hitsEvolution: external_CoreHome_["NumberFormatter"].calculateAndFormatEvolution(response.totals.hits, response.totals.previous_hits, true),
        hitsTrend: Math.sign(response.totals.hits - response.totals.previous_hits),
        pageviews: external_CoreHome_["NumberFormatter"].formatNumber(response.totals.nb_pageviews),
        pageviewsCompact: external_CoreHome_["NumberFormatter"].formatNumberCompact(response.totals.nb_pageviews),
        pageviewsEvolution: external_CoreHome_["NumberFormatter"].calculateAndFormatEvolution(response.totals.nb_pageviews, response.totals.previous_nb_pageviews, true),
        pageviewsTrend: Math.sign(response.totals.nb_pageviews - response.totals.previous_nb_pageviews),
        revenue: external_CoreHome_["NumberFormatter"].formatCurrency(response.totals.revenue, ''),
        revenueCompact: external_CoreHome_["NumberFormatter"].formatCurrencyCompact(response.totals.revenue, ''),
        revenueEvolution: external_CoreHome_["NumberFormatter"].calculateAndFormatEvolution(response.totals.revenue, response.totals.previous_revenue, true),
        revenueTrend: Math.sign(response.totals.revenue - response.totals.previous_revenue),
        visits: external_CoreHome_["NumberFormatter"].formatNumber(response.totals.nb_visits),
        visitsCompact: external_CoreHome_["NumberFormatter"].formatNumberCompact(response.totals.nb_visits),
        visitsEvolution: external_CoreHome_["NumberFormatter"].calculateAndFormatEvolution(response.totals.nb_visits, response.totals.previous_nb_visits, true),
        visitsTrend: Math.sign(response.totals.nb_visits - response.totals.previous_nb_visits)
      };
    }
  }, {
    key: "updateDashboardSites",
    value: function updateDashboardSites(response) {
      this.privateState.dashboardSites = response.sites;
      this.privateState.numSites = response.numSites;
    }
  }]);

  return DashboardStore;
}();

/* harmony default export */ var AllWebsitesDashboard_store = (new AllWebsitesDashboard_store_DashboardStore());
// CONCATENATED MODULE: ./node_modules/@vue/cli-plugin-babel/node_modules/cache-loader/dist/cjs.js??ref--12-0!./node_modules/@vue/cli-plugin-babel/node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/@vue/cli-service/node_modules/vue-loader-v16/dist/templateLoader.js??ref--6!./node_modules/@vue/cli-service/node_modules/cache-loader/dist/cjs.js??ref--0-0!./node_modules/@vue/cli-service/node_modules/vue-loader-v16/dist??ref--0-1!./plugins/MultiSites/vue/src/AllWebsitesDashboard/KPICardContainer.vue?vue&type=template&id=87c62b90

var KPICardContainervue_type_template_id_87c62b90_hoisted_1 = {
  class: "kpiCardContainer"
};
var KPICardContainervue_type_template_id_87c62b90_hoisted_2 = {
  key: 0,
  class: "kpiCard kpiCardLoading"
};

var KPICardContainervue_type_template_id_87c62b90_hoisted_3 = /*#__PURE__*/Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("div", {
  class: "kpiCardTitle"
}, " ", -1);

var KPICardContainervue_type_template_id_87c62b90_hoisted_4 = {
  class: "kpiCardValue"
};

var KPICardContainervue_type_template_id_87c62b90_hoisted_5 = /*#__PURE__*/Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("div", {
  class: "kpiCardEvolution"
}, [/*#__PURE__*/Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("span", {
  class: "kpiCardEvolutionTrend"
}, " ")], -1);

var KPICardContainervue_type_template_id_87c62b90_hoisted_6 = {
  key: 0,
  class: "kpiCardBadge"
};
function KPICardContainervue_type_template_id_87c62b90_render(_ctx, _cache, $props, $setup, $data, $options) {
  var _component_MatomoLoader = Object(external_commonjs_vue_commonjs2_vue_root_Vue_["resolveComponent"])("MatomoLoader");

  var _component_KPICard = Object(external_commonjs_vue_commonjs2_vue_root_Vue_["resolveComponent"])("KPICard");

  return Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("div", KPICardContainervue_type_template_id_87c62b90_hoisted_1, [_ctx.isLoading ? (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("div", KPICardContainervue_type_template_id_87c62b90_hoisted_2, [KPICardContainervue_type_template_id_87c62b90_hoisted_3, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("div", KPICardContainervue_type_template_id_87c62b90_hoisted_4, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createVNode"])(_component_MatomoLoader)]), KPICardContainervue_type_template_id_87c62b90_hoisted_5, _ctx.hasKpiBadge ? (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("div", KPICardContainervue_type_template_id_87c62b90_hoisted_6, " ")) : Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createCommentVNode"])("", true)])) : (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(true), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])(external_commonjs_vue_commonjs2_vue_root_Vue_["Fragment"], {
    key: 1
  }, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["renderList"])(_ctx.kpis, function (kpi, index) {
    return Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])(external_commonjs_vue_commonjs2_vue_root_Vue_["Fragment"], {
      key: "kpi-card-".concat(index)
    }, [index > 0 ? (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("div", {
      key: 0,
      class: Object(external_commonjs_vue_commonjs2_vue_root_Vue_["normalizeClass"])({
        kpiCardDivider: true,
        kpiCardDividerBadge: _ctx.hasKpiBadge
      })
    }, " ", 2)) : Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createCommentVNode"])("", true), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createVNode"])(_component_KPICard, {
      "model-value": kpi
    }, null, 8, ["model-value"])], 64);
  }), 128))]);
}
// CONCATENATED MODULE: ./plugins/MultiSites/vue/src/AllWebsitesDashboard/KPICardContainer.vue?vue&type=template&id=87c62b90

// CONCATENATED MODULE: ./node_modules/@vue/cli-plugin-babel/node_modules/cache-loader/dist/cjs.js??ref--12-0!./node_modules/@vue/cli-plugin-babel/node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/@vue/cli-service/node_modules/vue-loader-v16/dist/templateLoader.js??ref--6!./node_modules/@vue/cli-service/node_modules/cache-loader/dist/cjs.js??ref--0-0!./node_modules/@vue/cli-service/node_modules/vue-loader-v16/dist??ref--0-1!./plugins/MultiSites/vue/src/AllWebsitesDashboard/KPICard.vue?vue&type=template&id=7635ff0a

var KPICardvue_type_template_id_7635ff0a_hoisted_1 = {
  class: "kpiCard"
};
var KPICardvue_type_template_id_7635ff0a_hoisted_2 = {
  class: "kpiCardTitle"
};
var KPICardvue_type_template_id_7635ff0a_hoisted_3 = {
  style: {
    "display": "none"
  },
  ref: "kpiCardTooltipTemplate"
};
var KPICardvue_type_template_id_7635ff0a_hoisted_4 = {
  role: "tooltip"
};
var KPICardvue_type_template_id_7635ff0a_hoisted_5 = ["title"];
var KPICardvue_type_template_id_7635ff0a_hoisted_6 = {
  class: "kpiCardEvolution"
};
var KPICardvue_type_template_id_7635ff0a_hoisted_7 = {
  key: 1,
  class: "kpiCardEvolution"
};

var KPICardvue_type_template_id_7635ff0a_hoisted_8 = /*#__PURE__*/Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("span", {
  class: "kpiCardEvolutionTrend"
}, " ", -1);

var KPICardvue_type_template_id_7635ff0a_hoisted_9 = [KPICardvue_type_template_id_7635ff0a_hoisted_8];
var KPICardvue_type_template_id_7635ff0a_hoisted_10 = ["title", "innerHTML"];
function KPICardvue_type_template_id_7635ff0a_render(_ctx, _cache, $props, $setup, $data, $options) {
  var _directive_tooltips = Object(external_commonjs_vue_commonjs2_vue_root_Vue_["resolveDirective"])("tooltips");

  return Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("div", KPICardvue_type_template_id_7635ff0a_hoisted_1, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("div", KPICardvue_type_template_id_7635ff0a_hoisted_2, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("span", {
    class: Object(external_commonjs_vue_commonjs2_vue_root_Vue_["normalizeClass"])("kpiCardIcon ".concat(_ctx.kpi.icon))
  }, null, 2), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createTextVNode"])(" " + Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate(_ctx.kpi.title)), 1)]), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("div", KPICardvue_type_template_id_7635ff0a_hoisted_3, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("div", KPICardvue_type_template_id_7635ff0a_hoisted_4, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("h3", null, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate(_ctx.kpi.title)), 1), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createTextVNode"])(" " + Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.kpi.value), 1)])], 512), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["withDirectives"])(Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("div", {
    class: "kpiCardValue",
    title: _ctx.kpi.value
  }, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createTextVNode"])(Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.kpi.valueCompact), 1)], 8, KPICardvue_type_template_id_7635ff0a_hoisted_5), [[_directive_tooltips, {
    duration: 200,
    delay: 200,
    content: _ctx.tooltipContent
  }]]), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("div", KPICardvue_type_template_id_7635ff0a_hoisted_6, [_ctx.kpi.evolutionValue !== '' ? (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])(external_commonjs_vue_commonjs2_vue_root_Vue_["Fragment"], {
    key: 0
  }, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("span", {
    class: Object(external_commonjs_vue_commonjs2_vue_root_Vue_["normalizeClass"])("kpiCardEvolutionTrend ".concat(_ctx.evolutionTrendClass))
  }, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("span", {
    class: Object(external_commonjs_vue_commonjs2_vue_root_Vue_["normalizeClass"])("kpiCardEvolutionIcon ".concat(_ctx.evolutionTrendIcon))
  }, null, 2), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createTextVNode"])(" " + Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.kpi.evolutionValue) + "  ", 1)], 2), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("span", null, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate(_ctx.evolutionTrendFrom)), 1)], 64)) : (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("div", KPICardvue_type_template_id_7635ff0a_hoisted_7, KPICardvue_type_template_id_7635ff0a_hoisted_9))]), _ctx.kpi.badge ? Object(external_commonjs_vue_commonjs2_vue_root_Vue_["withDirectives"])((Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("div", {
    key: 0,
    class: "kpiCardBadge",
    title: _ctx.kpi.badge.title,
    innerHTML: _ctx.$sanitize(_ctx.kpi.badge.label)
  }, null, 8, KPICardvue_type_template_id_7635ff0a_hoisted_10)), [[_directive_tooltips, {
    duration: 200,
    delay: 200
  }]]) : Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createCommentVNode"])("", true)]);
}
// CONCATENATED MODULE: ./plugins/MultiSites/vue/src/AllWebsitesDashboard/KPICard.vue?vue&type=template&id=7635ff0a

// CONCATENATED MODULE: ./node_modules/@vue/cli-plugin-typescript/node_modules/cache-loader/dist/cjs.js??ref--14-0!./node_modules/babel-loader/lib!./node_modules/@vue/cli-plugin-typescript/node_modules/ts-loader??ref--14-2!./node_modules/@vue/cli-service/node_modules/cache-loader/dist/cjs.js??ref--0-0!./node_modules/@vue/cli-service/node_modules/vue-loader-v16/dist??ref--0-1!./plugins/MultiSites/vue/src/AllWebsitesDashboard/KPICard.vue?vue&type=script&lang=ts


/* harmony default export */ var KPICardvue_type_script_lang_ts = (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["defineComponent"])({
  directives: {
    Tooltips: external_CoreHome_["Tooltips"]
  },
  props: {
    modelValue: {
      type: Object,
      required: true
    }
  },
  computed: {
    tooltipContent: function tooltipContent() {
      var _this = this;

      return function () {
        var _this$$refs$kpiCardTo;

        return ((_this$$refs$kpiCardTo = _this.$refs.kpiCardTooltipTemplate) === null || _this$$refs$kpiCardTo === void 0 ? void 0 : _this$$refs$kpiCardTo.innerHTML) || '';
      };
    },
    evolutionTrendFrom: function evolutionTrendFrom() {
      switch (this.kpi.evolutionPeriod) {
        case 'day':
          return 'MultiSites_EvolutionFromPreviousDay';

        case 'week':
          return 'MultiSites_EvolutionFromPreviousWeek';

        case 'month':
          return 'MultiSites_EvolutionFromPreviousMonth';

        case 'year':
          return 'MultiSites_EvolutionFromPreviousYear';

        default:
          return 'MultiSites_EvolutionFromPreviousPeriod';
      }
    },
    evolutionTrendClass: function evolutionTrendClass() {
      if (this.kpi.evolutionTrend === 1) {
        return 'kpiTrendPositive';
      }

      if (this.kpi.evolutionTrend === -1) {
        return 'kpiTrendNegative';
      }

      return 'kpiTrendNeutral';
    },
    evolutionTrendIcon: function evolutionTrendIcon() {
      if (this.kpi.evolutionTrend === 1) {
        return 'icon-chevron-up';
      }

      if (this.kpi.evolutionTrend === -1) {
        return 'icon-chevron-down';
      }

      return 'icon-circle';
    },
    kpi: function kpi() {
      return this.modelValue;
    }
  }
}));
// CONCATENATED MODULE: ./plugins/MultiSites/vue/src/AllWebsitesDashboard/KPICard.vue?vue&type=script&lang=ts
 
// CONCATENATED MODULE: ./plugins/MultiSites/vue/src/AllWebsitesDashboard/KPICard.vue



KPICardvue_type_script_lang_ts.render = KPICardvue_type_template_id_7635ff0a_render

/* harmony default export */ var KPICard = (KPICardvue_type_script_lang_ts);
// CONCATENATED MODULE: ./node_modules/@vue/cli-plugin-typescript/node_modules/cache-loader/dist/cjs.js??ref--14-0!./node_modules/babel-loader/lib!./node_modules/@vue/cli-plugin-typescript/node_modules/ts-loader??ref--14-2!./node_modules/@vue/cli-service/node_modules/cache-loader/dist/cjs.js??ref--0-0!./node_modules/@vue/cli-service/node_modules/vue-loader-v16/dist??ref--0-1!./plugins/MultiSites/vue/src/AllWebsitesDashboard/KPICardContainer.vue?vue&type=script&lang=ts



/* harmony default export */ var KPICardContainervue_type_script_lang_ts = (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["defineComponent"])({
  components: {
    MatomoLoader: external_CoreHome_["MatomoLoader"],
    KPICard: KPICard
  },
  props: {
    isLoading: Boolean,
    modelValue: {
      type: Array,
      required: true
    }
  },
  computed: {
    hasKpiBadge: function hasKpiBadge() {
      return this.kpis.some(function (kpi) {
        return !!kpi.badge;
      });
    },
    kpis: function kpis() {
      return this.modelValue;
    }
  }
}));
// CONCATENATED MODULE: ./plugins/MultiSites/vue/src/AllWebsitesDashboard/KPICardContainer.vue?vue&type=script&lang=ts
 
// CONCATENATED MODULE: ./plugins/MultiSites/vue/src/AllWebsitesDashboard/KPICardContainer.vue



KPICardContainervue_type_script_lang_ts.render = KPICardContainervue_type_template_id_87c62b90_render

/* harmony default export */ var KPICardContainer = (KPICardContainervue_type_script_lang_ts);
// CONCATENATED MODULE: ./node_modules/@vue/cli-plugin-babel/node_modules/cache-loader/dist/cjs.js??ref--12-0!./node_modules/@vue/cli-plugin-babel/node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/@vue/cli-service/node_modules/vue-loader-v16/dist/templateLoader.js??ref--6!./node_modules/@vue/cli-service/node_modules/cache-loader/dist/cjs.js??ref--0-0!./node_modules/@vue/cli-service/node_modules/vue-loader-v16/dist??ref--0-1!./plugins/MultiSites/vue/src/AllWebsitesDashboard/SitesTable.vue?vue&type=template&id=76e8dfac

var SitesTablevue_type_template_id_76e8dfac_hoisted_1 = {
  class: "sitesTableContainer"
};
var SitesTablevue_type_template_id_76e8dfac_hoisted_2 = {
  class: "card-table dataTable sitesTable"
};
var SitesTablevue_type_template_id_76e8dfac_hoisted_3 = ["title"];
var SitesTablevue_type_template_id_76e8dfac_hoisted_4 = ["title"];
var SitesTablevue_type_template_id_76e8dfac_hoisted_5 = ["title"];
var SitesTablevue_type_template_id_76e8dfac_hoisted_6 = ["title"];
var SitesTablevue_type_template_id_76e8dfac_hoisted_7 = ["title"];
var SitesTablevue_type_template_id_76e8dfac_hoisted_8 = ["title"];
var SitesTablevue_type_template_id_76e8dfac_hoisted_9 = {
  class: "sitesTableEvolutionSelector"
};
var SitesTablevue_type_template_id_76e8dfac_hoisted_10 = ["value"];
var SitesTablevue_type_template_id_76e8dfac_hoisted_11 = {
  value: "hits_evolution"
};
var SitesTablevue_type_template_id_76e8dfac_hoisted_12 = {
  value: "visits_evolution"
};
var SitesTablevue_type_template_id_76e8dfac_hoisted_13 = {
  value: "pageviews_evolution"
};
var SitesTablevue_type_template_id_76e8dfac_hoisted_14 = {
  key: 0,
  value: "revenue_evolution"
};
var SitesTablevue_type_template_id_76e8dfac_hoisted_15 = {
  key: 0
};
var SitesTablevue_type_template_id_76e8dfac_hoisted_16 = {
  class: "sitesTableLoading",
  colspan: "7"
};
var SitesTablevue_type_template_id_76e8dfac_hoisted_17 = {
  key: 0,
  class: "sitesTablePagination"
};
var _hoisted_18 = {
  class: "dataTablePages"
};
function SitesTablevue_type_template_id_76e8dfac_render(_ctx, _cache, $props, $setup, $data, $options) {
  var _component_MatomoLoader = Object(external_commonjs_vue_commonjs2_vue_root_Vue_["resolveComponent"])("MatomoLoader");

  var _component_SitesTableSite = Object(external_commonjs_vue_commonjs2_vue_root_Vue_["resolveComponent"])("SitesTableSite");

  var _directive_tooltips = Object(external_commonjs_vue_commonjs2_vue_root_Vue_["resolveDirective"])("tooltips");

  return Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])(external_commonjs_vue_commonjs2_vue_root_Vue_["Fragment"], null, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("div", SitesTablevue_type_template_id_76e8dfac_hoisted_1, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["withDirectives"])(Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("table", SitesTablevue_type_template_id_76e8dfac_hoisted_2, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("thead", null, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("tr", null, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("th", {
    onClick: _cache[0] || (_cache[0] = function ($event) {
      return _ctx.sortBy('label');
    }),
    class: "label",
    title: _ctx.translate('MultiSites_MetricDocumentationWebsite')
  }, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createTextVNode"])(Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate('General_Website')) + " ", 1), _ctx.sortColumn === 'label' ? (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("span", {
    key: 0,
    class: Object(external_commonjs_vue_commonjs2_vue_root_Vue_["normalizeClass"])(_ctx.sortColumnClass)
  }, null, 2)) : Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createCommentVNode"])("", true)], 8, SitesTablevue_type_template_id_76e8dfac_hoisted_3), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("th", {
    onClick: _cache[1] || (_cache[1] = function ($event) {
      return _ctx.sortBy('nb_visits');
    }),
    title: _ctx.translate('MultiSites_MetricDocumentationVisits')
  }, [_ctx.sortColumn === 'nb_visits' ? (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("span", {
    key: 0,
    class: Object(external_commonjs_vue_commonjs2_vue_root_Vue_["normalizeClass"])(_ctx.sortColumnClass)
  }, null, 2)) : Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createCommentVNode"])("", true), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createTextVNode"])(" " + Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate('General_ColumnNbVisits')), 1)], 8, SitesTablevue_type_template_id_76e8dfac_hoisted_4), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("th", {
    onClick: _cache[2] || (_cache[2] = function ($event) {
      return _ctx.sortBy('nb_pageviews');
    }),
    title: _ctx.translate('MultiSites_MetricDocumentationPageviews')
  }, [_ctx.sortColumn === 'nb_pageviews' ? (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("span", {
    key: 0,
    class: Object(external_commonjs_vue_commonjs2_vue_root_Vue_["normalizeClass"])(_ctx.sortColumnClass)
  }, null, 2)) : Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createCommentVNode"])("", true), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createTextVNode"])(" " + Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate('General_ColumnPageviews')), 1)], 8, SitesTablevue_type_template_id_76e8dfac_hoisted_5), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("th", {
    onClick: _cache[3] || (_cache[3] = function ($event) {
      return _ctx.sortBy('hits');
    }),
    title: _ctx.translate('MultiSites_MetricDocumentationHits')
  }, [_ctx.sortColumn === 'hits' ? (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("span", {
    key: 0,
    class: Object(external_commonjs_vue_commonjs2_vue_root_Vue_["normalizeClass"])(_ctx.sortColumnClass)
  }, null, 2)) : Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createCommentVNode"])("", true), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createTextVNode"])(" " + Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate('General_ColumnHits')), 1)], 8, SitesTablevue_type_template_id_76e8dfac_hoisted_6), _ctx.displayRevenue ? (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("th", {
    key: 0,
    onClick: _cache[4] || (_cache[4] = function ($event) {
      return _ctx.sortBy('revenue');
    }),
    title: _ctx.translate('MultiSites_MetricDocumentationRevenue')
  }, [_ctx.sortColumn === 'revenue' ? (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("span", {
    key: 0,
    class: Object(external_commonjs_vue_commonjs2_vue_root_Vue_["normalizeClass"])(_ctx.sortColumnClass)
  }, null, 2)) : Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createCommentVNode"])("", true), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createTextVNode"])(" " + Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate('General_ColumnRevenue')), 1)], 8, SitesTablevue_type_template_id_76e8dfac_hoisted_7)) : Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createCommentVNode"])("", true), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("th", {
    onClick: _cache[5] || (_cache[5] = function ($event) {
      return _ctx.sortBy(_ctx.evolutionSelector);
    }),
    title: _ctx.translate('MultiSites_MetricDocumentationEvolution')
  }, [_ctx.sortColumn === _ctx.evolutionSelector ? (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("span", {
    key: 0,
    class: Object(external_commonjs_vue_commonjs2_vue_root_Vue_["normalizeClass"])(_ctx.sortColumnClass)
  }, null, 2)) : Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createCommentVNode"])("", true), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createTextVNode"])(" " + Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate('MultiSites_Evolution')), 1)], 8, SitesTablevue_type_template_id_76e8dfac_hoisted_8), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("th", SitesTablevue_type_template_id_76e8dfac_hoisted_9, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("select", {
    class: "browser-default",
    value: _ctx.evolutionSelector,
    onChange: _cache[6] || (_cache[6] = function ($event) {
      return _ctx.changeEvolutionSelector($event.target.value);
    })
  }, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("option", SitesTablevue_type_template_id_76e8dfac_hoisted_11, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate('General_ColumnHits')), 1), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("option", SitesTablevue_type_template_id_76e8dfac_hoisted_12, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate('General_ColumnNbVisits')), 1), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("option", SitesTablevue_type_template_id_76e8dfac_hoisted_13, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate('General_ColumnPageviews')), 1), _ctx.displayRevenue ? (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("option", SitesTablevue_type_template_id_76e8dfac_hoisted_14, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate('General_ColumnRevenue')), 1)) : Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createCommentVNode"])("", true)], 40, SitesTablevue_type_template_id_76e8dfac_hoisted_10)])])]), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("tbody", null, [_ctx.isLoading ? (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("tr", SitesTablevue_type_template_id_76e8dfac_hoisted_15, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("td", SitesTablevue_type_template_id_76e8dfac_hoisted_16, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createVNode"])(_component_MatomoLoader)])])) : (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(true), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])(external_commonjs_vue_commonjs2_vue_root_Vue_["Fragment"], {
    key: 1
  }, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["renderList"])(_ctx.sites, function (site) {
    return Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createBlock"])(_component_SitesTableSite, {
      "display-revenue": _ctx.displayRevenue,
      "evolution-metric": _ctx.evolutionMetric,
      key: "site-".concat(site.idsite),
      "model-value": site,
      "display-sparkline": _ctx.displaySparklines,
      "sparkline-metric": _ctx.sparklineMetric
    }, null, 8, ["display-revenue", "evolution-metric", "model-value", "display-sparkline", "sparkline-metric"]);
  }), 128))])], 512), [[_directive_tooltips]])]), !_ctx.isLoading || _ctx.paginationUpperBound > 0 ? (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("div", SitesTablevue_type_template_id_76e8dfac_hoisted_17, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["withDirectives"])(Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("span", {
    class: "dataTablePrevious",
    onClick: _cache[7] || (_cache[7] = function ($event) {
      return _ctx.navigatePreviousPage();
    })
  }, " « " + Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate('General_Previous')), 513), [[external_commonjs_vue_commonjs2_vue_root_Vue_["vShow"], _ctx.paginationCurrentPage !== 0]]), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("span", _hoisted_18, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate('General_Pagination', _ctx.paginationLowerBound, _ctx.paginationUpperBound, _ctx.numberOfFilteredSites)), 1), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["withDirectives"])(Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("span", {
    class: "dataTableNext",
    onClick: _cache[8] || (_cache[8] = function ($event) {
      return _ctx.navigateNextPage();
    })
  }, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.translate('General_Next')) + " » ", 513), [[external_commonjs_vue_commonjs2_vue_root_Vue_["vShow"], _ctx.paginationCurrentPage < _ctx.paginationMaxPage]])])) : Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createCommentVNode"])("", true)], 64);
}
// CONCATENATED MODULE: ./plugins/MultiSites/vue/src/AllWebsitesDashboard/SitesTable.vue?vue&type=template&id=76e8dfac

// CONCATENATED MODULE: ./node_modules/@vue/cli-plugin-babel/node_modules/cache-loader/dist/cjs.js??ref--12-0!./node_modules/@vue/cli-plugin-babel/node_modules/thread-loader/dist/cjs.js!./node_modules/babel-loader/lib!./node_modules/@vue/cli-service/node_modules/vue-loader-v16/dist/templateLoader.js??ref--6!./node_modules/@vue/cli-service/node_modules/cache-loader/dist/cjs.js??ref--0-0!./node_modules/@vue/cli-service/node_modules/vue-loader-v16/dist??ref--0-1!./plugins/MultiSites/vue/src/AllWebsitesDashboard/SitesTableSite.vue?vue&type=template&id=66fe07ff

var SitesTableSitevue_type_template_id_66fe07ff_hoisted_1 = {
  class: "label"
};
var SitesTableSitevue_type_template_id_66fe07ff_hoisted_2 = ["href", "title"];

var SitesTableSitevue_type_template_id_66fe07ff_hoisted_3 = /*#__PURE__*/Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("span", {
  class: "icon icon-outlink"
}, null, -1);

var SitesTableSitevue_type_template_id_66fe07ff_hoisted_4 = [SitesTableSitevue_type_template_id_66fe07ff_hoisted_3];
var SitesTableSitevue_type_template_id_66fe07ff_hoisted_5 = ["href"];
var SitesTableSitevue_type_template_id_66fe07ff_hoisted_6 = {
  key: 1,
  class: "value"
};
var SitesTableSitevue_type_template_id_66fe07ff_hoisted_7 = {
  class: "value"
};
var SitesTableSitevue_type_template_id_66fe07ff_hoisted_8 = {
  class: "value"
};
var SitesTableSitevue_type_template_id_66fe07ff_hoisted_9 = {
  class: "value"
};
var SitesTableSitevue_type_template_id_66fe07ff_hoisted_10 = {
  key: 0
};
var SitesTableSitevue_type_template_id_66fe07ff_hoisted_11 = {
  class: "value"
};
var SitesTableSitevue_type_template_id_66fe07ff_hoisted_12 = ["colspan"];
var SitesTableSitevue_type_template_id_66fe07ff_hoisted_13 = ["src"];
var SitesTableSitevue_type_template_id_66fe07ff_hoisted_14 = {
  key: 1,
  class: "sitesTableSparkline"
};
var SitesTableSitevue_type_template_id_66fe07ff_hoisted_15 = ["href", "title"];
var SitesTableSitevue_type_template_id_66fe07ff_hoisted_16 = ["src"];
function SitesTableSitevue_type_template_id_66fe07ff_render(_ctx, _cache, $props, $setup, $data, $options) {
  return Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("tr", {
    class: Object(external_commonjs_vue_commonjs2_vue_root_Vue_["normalizeClass"])({
      sitesTableGroup: !!_ctx.site.isGroup,
      sitesTableGroupSite: !_ctx.site.isGroup && !!_ctx.site.group,
      sitesTableSite: !_ctx.site.isGroup && !_ctx.site.group
    })
  }, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("td", SitesTableSitevue_type_template_id_66fe07ff_hoisted_1, [!_ctx.site.isGroup ? (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])(external_commonjs_vue_commonjs2_vue_root_Vue_["Fragment"], {
    key: 0
  }, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("a", {
    rel: "noreferrer noopener",
    target: "_blank",
    href: _ctx.site.main_url,
    title: _ctx.translate('General_GoTo', _ctx.site.main_url)
  }, SitesTableSitevue_type_template_id_66fe07ff_hoisted_4, 8, SitesTableSitevue_type_template_id_66fe07ff_hoisted_2), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("a", {
    title: "View reports",
    class: "value",
    href: _ctx.dashboardUrl
  }, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.siteLabel), 9, SitesTableSitevue_type_template_id_66fe07ff_hoisted_5)], 64)) : (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("span", SitesTableSitevue_type_template_id_66fe07ff_hoisted_6, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.siteLabel), 1))]), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("td", null, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("span", SitesTableSitevue_type_template_id_66fe07ff_hoisted_7, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.formatNumber(_ctx.site.nb_visits)), 1)]), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("td", null, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("span", SitesTableSitevue_type_template_id_66fe07ff_hoisted_8, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.formatNumber(_ctx.site.nb_pageviews)), 1)]), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("td", null, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("span", SitesTableSitevue_type_template_id_66fe07ff_hoisted_9, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.formatNumber(_ctx.site.hits)), 1)]), _ctx.displayRevenue ? (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("td", SitesTableSitevue_type_template_id_66fe07ff_hoisted_10, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("span", SitesTableSitevue_type_template_id_66fe07ff_hoisted_11, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.formatCurrency(_ctx.site.revenue, _ctx.site.currencySymbol || '')), 1)])) : Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createCommentVNode"])("", true), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("td", {
    colspan: _ctx.displaySparkline ? 1 : 2
  }, [!_ctx.site.isGroup && _ctx.sparklineMetric in _ctx.site ? (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])(external_commonjs_vue_commonjs2_vue_root_Vue_["Fragment"], {
    key: 0
  }, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("img", {
    src: _ctx.evolutionIconSrc,
    alt: ""
  }, null, 8, SitesTableSitevue_type_template_id_66fe07ff_hoisted_13), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("span", {
    class: Object(external_commonjs_vue_commonjs2_vue_root_Vue_["normalizeClass"])(_ctx.evolutionTrendClass)
  }, Object(external_commonjs_vue_commonjs2_vue_root_Vue_["toDisplayString"])(_ctx.calculateAndFormatEvolution(_ctx.site[_ctx.sparklineMetric], _ctx.site["previous_".concat(_ctx.sparklineMetric)] * _ctx.site.ratio, true)), 3)], 64)) : Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createCommentVNode"])("", true)], 8, SitesTableSitevue_type_template_id_66fe07ff_hoisted_12), _ctx.displaySparkline ? (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("td", SitesTableSitevue_type_template_id_66fe07ff_hoisted_14, [!_ctx.site.isGroup ? (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["openBlock"])(), Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementBlock"])("a", {
    key: 0,
    rel: "noreferrer noopener",
    target: "_blank",
    href: _ctx.dashboardUrl,
    title: _ctx.translate('General_GoTo', _ctx.translate('Dashboard_DashboardOf', _ctx.siteLabel))
  }, [Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createElementVNode"])("img", {
    alt: "",
    width: "100",
    height: "25",
    src: _ctx.evolutionSparklineSrc
  }, null, 8, SitesTableSitevue_type_template_id_66fe07ff_hoisted_16)], 8, SitesTableSitevue_type_template_id_66fe07ff_hoisted_15)) : Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createCommentVNode"])("", true)])) : Object(external_commonjs_vue_commonjs2_vue_root_Vue_["createCommentVNode"])("", true)], 2);
}
// CONCATENATED MODULE: ./plugins/MultiSites/vue/src/AllWebsitesDashboard/SitesTableSite.vue?vue&type=template&id=66fe07ff

// CONCATENATED MODULE: ./node_modules/@vue/cli-plugin-typescript/node_modules/cache-loader/dist/cjs.js??ref--14-0!./node_modules/babel-loader/lib!./node_modules/@vue/cli-plugin-typescript/node_modules/ts-loader??ref--14-2!./node_modules/@vue/cli-service/node_modules/cache-loader/dist/cjs.js??ref--0-0!./node_modules/@vue/cli-service/node_modules/vue-loader-v16/dist??ref--0-1!./plugins/MultiSites/vue/src/AllWebsitesDashboard/SitesTableSite.vue?vue&type=script&lang=ts


/* harmony default export */ var SitesTableSitevue_type_script_lang_ts = (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["defineComponent"])({
  props: {
    displayRevenue: {
      type: Boolean,
      required: true
    },
    evolutionMetric: {
      type: String,
      required: true
    },
    modelValue: {
      type: Object,
      required: true
    },
    sparklineMetric: String,
    displaySparkline: Boolean
  },
  computed: {
    dashboardUrl: function dashboardUrl() {
      var dashboardParams = external_CoreHome_["MatomoUrl"].stringify({
        module: 'CoreHome',
        action: 'index',
        date: external_CoreHome_["Matomo"].currentDateString,
        period: external_CoreHome_["Matomo"].period,
        idSite: this.site.idsite
      });
      return "?".concat(dashboardParams).concat(this.tokenParam);
    },
    evolutionIconSrc: function evolutionIconSrc() {
      if (this.evolutionTrend === 1) {
        return 'plugins/MultiSites/images/arrow_up.png';
      }

      if (this.evolutionTrend === -1) {
        return 'plugins/MultiSites/images/arrow_down.png';
      }

      return 'plugins/MultiSites/images/stop.png';
    },
    evolutionSparklineSrc: function evolutionSparklineSrc() {
      var sparklineDate = external_CoreHome_["Matomo"].currentDateString;

      if (external_CoreHome_["Matomo"].period !== 'range') {
        var _Range$getLastNRange = external_CoreHome_["Range"].getLastNRange(external_CoreHome_["Matomo"].period, '30', external_CoreHome_["Matomo"].currentDateString),
            startDate = _Range$getLastNRange.startDate,
            endDate = _Range$getLastNRange.endDate;

        sparklineDate = "".concat(Object(external_CoreHome_["format"])(startDate), ",").concat(Object(external_CoreHome_["format"])(endDate));
      }

      var sparklineParams = external_CoreHome_["MatomoUrl"].stringify({
        module: 'MultiSites',
        action: 'getEvolutionGraph',
        date: sparklineDate,
        period: external_CoreHome_["Matomo"].period,
        idSite: this.site.idsite,
        columns: this.sparklineMetric,
        evolutionBy: this.sparklineMetric,
        colors: JSON.stringify(external_CoreHome_["Matomo"].getSparklineColors()),
        viewDataTable: 'sparkline'
      });
      return "?".concat(sparklineParams).concat(this.tokenParam);
    },
    evolutionTrend: function evolutionTrend() {
      var property = "".concat(this.evolutionMetric, "_trend");
      return this.site[property];
    },
    evolutionTrendClass: function evolutionTrendClass() {
      if (this.evolutionTrend === 1) {
        return 'evolutionTrendPositive';
      }

      if (this.evolutionTrend === -1) {
        return 'evolutionTrendNegative';
      }

      return '';
    },
    site: function site() {
      return this.modelValue;
    },
    siteLabel: function siteLabel() {
      return external_CoreHome_["Matomo"].helper.htmlDecode(this.site.label);
    },
    tokenParam: function tokenParam() {
      var token_auth = external_CoreHome_["MatomoUrl"].urlParsed.value.token_auth;
      return token_auth ? "&token_auth=".concat(token_auth) : '';
    }
  }
}));
// CONCATENATED MODULE: ./plugins/MultiSites/vue/src/AllWebsitesDashboard/SitesTableSite.vue?vue&type=script&lang=ts
 
// CONCATENATED MODULE: ./plugins/MultiSites/vue/src/AllWebsitesDashboard/SitesTableSite.vue



SitesTableSitevue_type_script_lang_ts.render = SitesTableSitevue_type_template_id_66fe07ff_render

/* harmony default export */ var SitesTableSite = (SitesTableSitevue_type_script_lang_ts);
// CONCATENATED MODULE: ./node_modules/@vue/cli-plugin-typescript/node_modules/cache-loader/dist/cjs.js??ref--14-0!./node_modules/babel-loader/lib!./node_modules/@vue/cli-plugin-typescript/node_modules/ts-loader??ref--14-2!./node_modules/@vue/cli-service/node_modules/cache-loader/dist/cjs.js??ref--0-0!./node_modules/@vue/cli-service/node_modules/vue-loader-v16/dist??ref--0-1!./plugins/MultiSites/vue/src/AllWebsitesDashboard/SitesTable.vue?vue&type=script&lang=ts




/* harmony default export */ var SitesTablevue_type_script_lang_ts = (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["defineComponent"])({
  directives: {
    Tooltips: external_CoreHome_["Tooltips"]
  },
  components: {
    MatomoLoader: external_CoreHome_["MatomoLoader"],
    SitesTableSite: SitesTableSite
  },
  props: {
    displayRevenue: {
      type: Boolean,
      required: true
    },
    displaySparklines: {
      type: Boolean,
      required: true
    }
  },
  data: function data() {
    return {
      evolutionSelector: 'visits_evolution'
    };
  },
  computed: {
    errorLoading: function errorLoading() {
      return AllWebsitesDashboard_store.state.value.errorLoading;
    },
    errorShowProfessionalHelp: function errorShowProfessionalHelp() {
      return external_CoreHome_["Matomo"].config && external_CoreHome_["Matomo"].config.are_ads_enabled;
    },
    evolutionMetric: function evolutionMetric() {
      return this.evolutionSelector;
    },
    isLoading: function isLoading() {
      return AllWebsitesDashboard_store.state.value.isLoadingSites;
    },
    numberOfFilteredSites: function numberOfFilteredSites() {
      return AllWebsitesDashboard_store.state.value.numSites;
    },
    paginationCurrentPage: function paginationCurrentPage() {
      return AllWebsitesDashboard_store.state.value.paginationCurrentPage;
    },
    paginationLowerBound: function paginationLowerBound() {
      return AllWebsitesDashboard_store.paginationLowerBound.value;
    },
    paginationUpperBound: function paginationUpperBound() {
      return AllWebsitesDashboard_store.paginationUpperBound.value;
    },
    paginationMaxPage: function paginationMaxPage() {
      return AllWebsitesDashboard_store.numberOfPages.value;
    },
    sites: function sites() {
      return AllWebsitesDashboard_store.state.value.dashboardSites;
    },
    sortColumn: function sortColumn() {
      return AllWebsitesDashboard_store.state.value.sortColumn;
    },
    sortColumnClass: function sortColumnClass() {
      return {
        sitesTableSort: true,
        sitesTableSortAsc: this.sortOrder === 'asc',
        sitesTableSortDesc: this.sortOrder === 'desc'
      };
    },
    sortOrder: function sortOrder() {
      return AllWebsitesDashboard_store.state.value.sortOrder;
    },
    sparklineMetric: function sparklineMetric() {
      switch (this.evolutionMetric) {
        case 'hits_evolution':
          return 'hits';

        case 'pageviews_evolution':
          return 'nb_pageviews';

        case 'revenue_evolution':
          return 'revenue';

        case 'visits_evolution':
          return 'nb_visits';

        default:
          return '';
      }
    }
  },
  methods: {
    changeEvolutionSelector: function changeEvolutionSelector(metric) {
      this.evolutionSelector = metric;
      this.sortBy(metric);
    },
    navigateNextPage: function navigateNextPage() {
      AllWebsitesDashboard_store.navigateNextPage();
    },
    navigatePreviousPage: function navigatePreviousPage() {
      AllWebsitesDashboard_store.navigatePreviousPage();
    },
    sortBy: function sortBy(column) {
      AllWebsitesDashboard_store.sortBy(column);
    }
  }
}));
// CONCATENATED MODULE: ./plugins/MultiSites/vue/src/AllWebsitesDashboard/SitesTable.vue?vue&type=script&lang=ts
 
// CONCATENATED MODULE: ./plugins/MultiSites/vue/src/AllWebsitesDashboard/SitesTable.vue



SitesTablevue_type_script_lang_ts.render = SitesTablevue_type_template_id_76e8dfac_render

/* harmony default export */ var SitesTable = (SitesTablevue_type_script_lang_ts);
// CONCATENATED MODULE: ./node_modules/@vue/cli-plugin-typescript/node_modules/cache-loader/dist/cjs.js??ref--14-0!./node_modules/babel-loader/lib!./node_modules/@vue/cli-plugin-typescript/node_modules/ts-loader??ref--14-2!./node_modules/@vue/cli-service/node_modules/cache-loader/dist/cjs.js??ref--0-0!./node_modules/@vue/cli-service/node_modules/vue-loader-v16/dist??ref--0-1!./plugins/MultiSites/vue/src/AllWebsitesDashboard/AllWebsitesDashboard.vue?vue&type=script&lang=ts





/* harmony default export */ var AllWebsitesDashboardvue_type_script_lang_ts = (Object(external_commonjs_vue_commonjs2_vue_root_Vue_["defineComponent"])({
  components: {
    EnrichedHeadline: external_CoreHome_["EnrichedHeadline"],
    KPICardContainer: KPICardContainer,
    SitesTable: SitesTable
  },
  props: {
    autoRefreshInterval: {
      type: Number,
      required: true
    },
    displayRevenue: {
      type: Boolean,
      required: true
    },
    displaySparklines: {
      type: Boolean,
      required: true
    },
    isWidgetized: {
      type: Boolean,
      required: true
    },
    pageSize: {
      type: Number,
      required: true
    }
  },
  data: function data() {
    return {
      searchTerm: ''
    };
  },
  mounted: function mounted() {
    Object(external_commonjs_vue_commonjs2_vue_root_Vue_["watch"])(function () {
      return external_CoreHome_["MatomoUrl"].hashParsed.value;
    }, function () {
      return AllWebsitesDashboard_store.reloadDashboard();
    });
    AllWebsitesDashboard_store.setAutoRefreshInterval(this.autoRefreshInterval);
    AllWebsitesDashboard_store.setPageSize(this.pageSize);
    AllWebsitesDashboard_store.reloadDashboard();
  },
  computed: {
    addSiteUrl: function addSiteUrl() {
      return "?".concat(external_CoreHome_["MatomoUrl"].stringify(Object.assign(Object.assign(Object.assign({}, external_CoreHome_["MatomoUrl"].urlParsed.value), external_CoreHome_["MatomoUrl"].hashParsed.value), {}, {
        module: 'SitesManager',
        action: 'index',
        showaddsite: '1'
      })));
    },
    isLoadingKPIs: function isLoadingKPIs() {
      return AllWebsitesDashboard_store.state.value.isLoadingKPIs;
    },
    errorLoading: function errorLoading() {
      return AllWebsitesDashboard_store.state.value.errorLoading;
    },
    kpis: function kpis() {
      var _dashboardKPIs$badges, _dashboardKPIs$badges2, _dashboardKPIs$badges3;

      var dashboardKPIs = AllWebsitesDashboard_store.state.value.dashboardKPIs;
      var kpis = [{
        badge: ((_dashboardKPIs$badges = dashboardKPIs.badges) === null || _dashboardKPIs$badges === void 0 ? void 0 : _dashboardKPIs$badges.visits) || null,
        icon: 'icon-user',
        title: 'MultiSites_TotalVisits',
        value: dashboardKPIs.visits,
        valueCompact: dashboardKPIs.visitsCompact,
        evolutionPeriod: dashboardKPIs.evolutionPeriod,
        evolutionTrend: dashboardKPIs.visitsTrend,
        evolutionValue: dashboardKPIs.visitsEvolution
      }, {
        badge: ((_dashboardKPIs$badges2 = dashboardKPIs.badges) === null || _dashboardKPIs$badges2 === void 0 ? void 0 : _dashboardKPIs$badges2.pageviews) || null,
        icon: 'icon-show',
        title: 'MultiSites_TotalPageviews',
        value: dashboardKPIs.pageviews,
        valueCompact: dashboardKPIs.pageviewsCompact,
        evolutionPeriod: dashboardKPIs.evolutionPeriod,
        evolutionTrend: dashboardKPIs.pageviewsTrend,
        evolutionValue: dashboardKPIs.pageviewsEvolution
      }, {
        badge: ((_dashboardKPIs$badges3 = dashboardKPIs.badges) === null || _dashboardKPIs$badges3 === void 0 ? void 0 : _dashboardKPIs$badges3.hits) || null,
        icon: 'icon-hits',
        title: 'MultiSites_TotalHits',
        value: dashboardKPIs.hits,
        valueCompact: dashboardKPIs.hitsCompact,
        evolutionPeriod: dashboardKPIs.evolutionPeriod,
        evolutionTrend: dashboardKPIs.hitsTrend,
        evolutionValue: dashboardKPIs.hitsEvolution
      }];

      if (this.displayRevenue) {
        var _dashboardKPIs$badges4;

        kpis.push({
          badge: ((_dashboardKPIs$badges4 = dashboardKPIs.badges) === null || _dashboardKPIs$badges4 === void 0 ? void 0 : _dashboardKPIs$badges4.revenue) || null,
          icon: 'icon-dollar-sign',
          title: 'General_TotalRevenue',
          value: dashboardKPIs.revenue,
          valueCompact: dashboardKPIs.revenueCompact,
          evolutionPeriod: dashboardKPIs.evolutionPeriod,
          evolutionTrend: dashboardKPIs.revenueTrend,
          evolutionValue: dashboardKPIs.revenueEvolution
        });
      }

      return kpis;
    },
    isUserAllowedToAddSite: function isUserAllowedToAddSite() {
      return external_CoreHome_["Matomo"].hasSuperUserAccess;
    }
  },
  methods: {
    searchSite: function searchSite(term) {
      AllWebsitesDashboard_store.searchSite(term);
    }
  }
}));
// CONCATENATED MODULE: ./plugins/MultiSites/vue/src/AllWebsitesDashboard/AllWebsitesDashboard.vue?vue&type=script&lang=ts
 
// CONCATENATED MODULE: ./plugins/MultiSites/vue/src/AllWebsitesDashboard/AllWebsitesDashboard.vue



AllWebsitesDashboardvue_type_script_lang_ts.render = render

/* harmony default export */ var AllWebsitesDashboard = (AllWebsitesDashboardvue_type_script_lang_ts);
// CONCATENATED MODULE: ./plugins/MultiSites/vue/src/index.ts
/*!
 * Matomo - free/libre analytics platform
 *
 * @link    https://matomo.org
 * @license https://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

// CONCATENATED MODULE: ./node_modules/@vue/cli-service/lib/commands/build/entry-lib-no-default.js




/***/ })

/******/ });
});
//# sourceMappingURL=MultiSites.umd.js.map