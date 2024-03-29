var Atrament = (function (t) {
    var e = {};
    function n(o) {
        if (e[o]) return e[o].exports;
        var r = (e[o] = { i: o, l: !1, exports: {} });
        return t[o].call(r.exports, r, r.exports, n), (r.l = !0), r.exports;
    }
    return (
        (n.m = t),
        (n.c = e),
        (n.d = function (t, e, o) {
            n.o(t, e) || Object.defineProperty(t, e, { enumerable: !0, get: o });
        }),
        (n.r = function (t) {
            "undefined" != typeof Symbol && Symbol.toStringTag && Object.defineProperty(t, Symbol.toStringTag, { value: "Module" }), Object.defineProperty(t, "__esModule", { value: !0 });
        }),
        (n.t = function (t, e) {
            if ((1 & e && (t = n(t)), 8 & e)) return t;
            if (4 & e && "object" == typeof t && t && t.__esModule) return t;
            var o = Object.create(null);
            if ((n.r(o), Object.defineProperty(o, "default", { enumerable: !0, value: t }), 2 & e && "string" != typeof t))
                for (var r in t)
                    n.d(
                        o,
                        r,
                        function (e) {
                            return t[e];
                        }.bind(null, r)
                    );
            return o;
        }),
        (n.n = function (t) {
            var e =
                t && t.__esModule
                    ? function () {
                          return t.default;
                      }
                    : function () {
                          return t;
                      };
            return n.d(e, "a", e), e;
        }),
        (n.o = function (t, e) {
            return Object.prototype.hasOwnProperty.call(t, e);
        }),
        (n.p = ""),
        n((n.s = 0))
    );
})([
    function (t, e, n) {
        t.exports = n(1);
    },
    function (t, e, n) {
        t.exports = n(2);
    },
    function (t, e, n) {
        function o(t) {
            return (o =
                "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
                    ? function (t) {
                          return typeof t;
                      }
                    : function (t) {
                          return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
                      })(t);
        }
        function r(t) {
            return (
                (function (t) {
                    if (Array.isArray(t)) {
                        for (var e = 0, n = new Array(t.length); e < t.length; e++) n[e] = t[e];
                        return n;
                    }
                })(t) ||
                (function (t) {
                    if (Symbol.iterator in Object(t) || "[object Arguments]" === Object.prototype.toString.call(t)) return Array.from(t);
                })(t) ||
                (function () {
                    throw new TypeError("Invalid attempt to spread non-iterable instance");
                })()
            );
        }
        function i(t, e) {
            for (var n = 0; n < e.length; n++) {
                var o = e[n];
                (o.enumerable = o.enumerable || !1), (o.configurable = !0), "value" in o && (o.writable = !0), Object.defineProperty(t, o.key, o);
            }
        }
        function s(t) {
            return (s = Object.setPrototypeOf
                ? Object.getPrototypeOf
                : function (t) {
                      return t.__proto__ || Object.getPrototypeOf(t);
                  })(t);
        }
        function a(t) {
            if (void 0 === t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
            return t;
        }
        function c(t, e) {
            return (c =
                Object.setPrototypeOf ||
                function (t, e) {
                    return (t.__proto__ = e), t;
                })(t, e);
        }
        var u = n(3),
            h = u.Mouse,
            l = u.Point,
            f = n(4),
            p = n(5).AtramentEventTarget,
            v = n(6),
            d = { DRAW: "draw", ERASE: "erase", FILL: "fill", DISABLED: "disabled" },
            y = [d.DRAW, d.ERASE];
        t.exports = (function (t) {
            function e(t) {
                var n,
                    r,
                    i,
                    c = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : {};
                if (
                    ((function (t, e) {
                        if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function");
                    })(this, e),
                    "undefined" == typeof window)
                )
                    throw new Error("Looks like we're not running in a browser");
                if (((r = this), (i = s(e).call(this)), (n = !i || ("object" !== o(i) && "function" != typeof i) ? a(r) : i), t instanceof window.Node && "CANVAS" === t.tagName)) n.canvas = t;
                else {
                    if ("string" != typeof t) throw new Error("can't look for canvas based on '".concat(t, "'"));
                    n.canvas = document.querySelector(t);
                }
                if (!n.canvas) throw new Error("canvas not found");
                (n.canvas.width = c.width || n.canvas.width), (n.canvas.height = c.height || n.canvas.height), (n.mouse = new h());
                var u = function (t) {
                        t.cancelable && t.preventDefault();
                        var e = n.canvas.getBoundingClientRect(),
                            o = (t.changedTouches && t.changedTouches[0]) || t,
                            r = o.offsetX,
                            i = o.offsetY;
                        void 0 === r && (r = o.clientX - e.left), void 0 === i && (i = o.clientY - e.top);
                        var s = a(n).mouse;
                        if (s.down && y.includes(n.mode)) {
                            var c = n.draw(r, i, s.previous.x, s.previous.y),
                                u = c.x,
                                h = c.y;
                            n._dirty || n.mode !== d.DRAW || (r === s.x && i === s.y) || ((n._dirty = !0), n.fireDirty()), s.set(r, i), s.previous.set(u, h);
                        } else s.set(r, i);
                    },
                    l = function (t) {
                        if ((t.cancelable && t.preventDefault(), u(t), n.mode !== d.FILL)) {
                            var e = a(n).mouse;
                            e.previous.set(e.x, e.y), (e.down = !0), n.beginStroke(e.previous.x, e.previous.y);
                        } else n.fill();
                    },
                    p = function (t) {
                        if (n.mode !== d.FILL) {
                            var e = a(n).mouse;
                            if (e.down) {
                                var o = (t.changedTouches && t.changedTouches[0]) || t,
                                    r = o.offsetX,
                                    i = o.offsetY;
                                if (((e.down = !1), e.x === r && e.y === i && y.includes(n.mode))) {
                                    var s = n.draw(e.x, e.y, e.previous.x, e.previous.y),
                                        c = s.x,
                                        u = s.y;
                                    e.previous.set(c, u);
                                }
                                n.endStroke(e.x, e.y);
                            }
                        }
                    };
                return (
                    n.canvas.addEventListener("mousemove", u),
                    n.canvas.addEventListener("mousedown", l),
                    document.addEventListener("mouseup", p),
                    n.canvas.addEventListener("touchstart", l),
                    n.canvas.addEventListener("touchend", p),
                    n.canvas.addEventListener("touchmove", u),
                    (n.destroy = function () {
                        n.clear(),
                            n.canvas.removeEventListener("mousemove", u),
                            n.canvas.removeEventListener("mousedown", l),
                            document.removeEventListener("mouseup", p),
                            n.canvas.removeEventListener("touchstart", l),
                            n.canvas.removeEventListener("touchend", p),
                            n.canvas.removeEventListener("touchmove", u);
                    }),
                    (n.context = n.canvas.getContext("2d")),
                    (n.context.globalCompositeOperation = "source-over"),
                    (n.context.globalAlpha = 1),
                    (n.context.strokeStyle = c.color || "rgba(0,0,0,1)"),
                    (n.context.lineCap = "round"),
                    (n.context.lineJoin = "round"),
                    n.context.translate(0.5, 0.5),
                    (n._filling = !1),
                    (n._fillStack = []),
                    (n.recordStrokes = !1),
                    (n.strokeMemory = []),
                    (n.smoothing = f.initialSmoothingFactor),
                    (n._thickness = f.initialThickness),
                    (n._targetThickness = n._thickness),
                    (n._weight = n._thickness),
                    (n._maxWeight = n._thickness + f.weightSpread),
                    (n._mode = d.DRAW),
                    (n.adaptiveStroke = !0),
                    ["weight", "smoothing", "adaptiveStroke", "mode"].forEach(function (t) {
                        return void 0 === c[t] ? 0 : (n[t] = c[t]);
                    }),
                    n
                );
            }
            var n, u, p;
            return (
                (function (t, e) {
                    if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
                    (t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } })), e && c(t, e);
                })(e, t),
                (n = e),
                (u = [
                    {
                        key: "beginStroke",
                        value: function (t, e) {
                            this.context.beginPath(),
                                this.context.moveTo(t, e),
                                this.recordStrokes && ((this.strokeTimestamp = performance.now()), this.strokeMemory.push({ point: new l(t, e), time: performance.now() - this.strokeTimestamp })),
                                this.dispatchEvent("strokestart", { x: t, y: e });
                        },
                    },
                    {
                        key: "endStroke",
                        value: function (t, e) {
                            if (
                                (this.context.closePath(),
                                this.recordStrokes && this.strokeMemory.push({ point: new l(t, e), time: performance.now() - this.strokeTimestamp }),
                                this.dispatchEvent("strokeend", { x: t, y: e }),
                                this.recordStrokes)
                            ) {
                                var n = { points: this.strokeMemory.slice(), mode: this.mode, weight: this.weight, smoothing: this.smoothing, color: this.color, adaptiveStroke: this.adaptiveStroke };
                                this.dispatchEvent("strokerecorded", { stroke: n });
                            }
                            (this.strokeMemory = []), delete this.strokeTimestamp;
                        },
                    },
                    {
                        key: "draw",
                        value: function (t, e, n, o) {
                            this.recordStrokes && this.strokeMemory.push({ point: new l(t, e), time: performance.now() - this.strokeTimestamp });
                            var r = this.context,
                                i = v.lineDistance(t, e, n, o),
                                s = Math.min(f.minSmoothingFactor, this.smoothing + (i - 60) / 3e3),
                                a = t - (t - n) * s,
                                c = e - (e - o) * s,
                                u = v.lineDistance(a, c, n, o);
                            return (
                                this.adaptiveStroke
                                    ? ((this._targetThickness = ((u - f.minLineThickness) / f.lineThicknessRange) * (this._maxWeight - this._weight) + this._weight),
                                      this._thickness > this._targetThickness ? (this._thickness -= f.thicknessIncrement) : this._thickness < this._targetThickness && (this._thickness += f.thicknessIncrement),
                                      (r.lineWidth = this._thickness))
                                    : (r.lineWidth = this._weight),
                                r.quadraticCurveTo(n, o, a, c),
                                r.stroke(),
                                { x: a, y: c }
                            );
                        },
                    },
                    {
                        key: "isDirty",
                        value: function () {
                            return !!this._dirty;
                        },
                    },
                    {
                        key: "fireDirty",
                        value: function () {
                            this.dispatchEvent("dirty");
                        },
                    },
                    {
                        key: "clear",
                        value: function () {
                            this.isDirty &&
                                ((this._dirty = !1),
                                this.dispatchEvent("clean"),
                                this.mode === d.ERASE
                                    ? ((this.mode = d.DRAW), this.context.clearRect(-10, -10, this.canvas.width + 20, this.canvas.height + 20), (this.mode = d.ERASE))
                                    : this.context.clearRect(-10, -10, this.canvas.width + 20, this.canvas.height + 20));
                        },
                    },
                    {
                        key: "toImage",
                        value: function () {
                            return this.canvas.toDataURL();
                        },
                    },
                    {
                        key: "fill",
                        value: function () {
                            var t = this,
                                e = this.mouse,
                                n = this.context,
                                o = Array.from(n.getImageData(e.x, e.y, 1, 1).data);
                            if (this._filling) this._fillStack.push([e.x, e.y, o]);
                            else {
                                var r = e.x,
                                    i = e.y;
                                this.dispatchEvent("fillstart", { x: r, y: i }),
                                    (this._filling = !0),
                                    setTimeout(function () {
                                        t._floodFill(e.x, e.y, o);
                                    }, f.floodFillInterval);
                            }
                        },
                    },
                    {
                        key: "_floodFill",
                        value: function (t, e, n) {
                            var o = this.context,
                                i = Math.floor(t),
                                s = Math.floor(e),
                                a = o.canvas.width,
                                c = o.canvas.height,
                                u = [[i, s]],
                                h = v.hexToRgb(this.color),
                                l = o.getImageData(0, 0, o.canvas.width, o.canvas.height),
                                f = Math.min(10 * o.globalAlpha * 255, 255),
                                p = v.colorPixel.apply(v, [l.data].concat(r(h), [n, f])),
                                d = v.matchColor.apply(v, [l.data].concat(r(n)));
                            if (v.matchColor.apply(v, [l.data].concat([].concat(r(h), [255])))(4 * (s * o.canvas.width + i))) return (this._filling = !1), void this.dispatchEvent("fillend", {});
                            for (; u.length; ) {
                                for (var y = u.pop(), m = y[0], g = y[1], b = 4 * (g * a + m); g-- >= 0 && d(b); ) b -= 4 * a;
                                (b += 4 * a), ++g;
                                for (var w = !1, k = !1; g++ < c - 1 && d(b); )
                                    p(b), m > 0 && (d(b - 4) ? w || (u.push([m - 1, g]), (w = !0)) : w && (w = !1)), m < a - 1 && (d(b + 4) ? k || (u.push([m + 1, g]), (k = !0)) : k && (k = !1)), (b += 4 * a);
                            }
                            o.putImageData(l, 0, 0), this._fillStack.length ? this._floodFill.apply(this, r(this._fillStack.shift())) : ((this._filling = !1), this.dispatchEvent("fillend", {}));
                        },
                    },
                    {
                        key: "color",
                        get: function () {
                            return this.context.strokeStyle;
                        },
                        set: function (t) {
                            if ("string" != typeof t) throw new Error("wrong argument type");
                            this.context.strokeStyle = t;
                        },
                    },
                    {
                        key: "weight",
                        get: function () {
                            return this._weight;
                        },
                        set: function (t) {
                            if ("number" != typeof t) throw new Error("wrong argument type");
                            (this._weight = t), (this._thickness = t), (this._targetThickness = t), (this._maxWeight = t + f.weightSpread);
                        },
                    },
                    {
                        key: "mode",
                        get: function () {
                            return this._mode;
                        },
                        set: function (t) {
                            if ("string" != typeof t) throw new Error("wrong argument type");
                            switch (t) {
                                case d.ERASE:
                                    (this._mode = d.ERASE), (this.context.globalCompositeOperation = "destination-out");
                                    break;
                                case d.FILL:
                                    (this._mode = d.FILL), (this.context.globalCompositeOperation = "source-over");
                                    break;
                                case d.DISABLED:
                                    this._mode = d.DISABLED;
                                    break;
                                default:
                                    (this._mode = d.DRAW), (this.context.globalCompositeOperation = "source-over");
                            }
                        },
                    },
                ]) && i(n.prototype, u),
                p && i(n, p),
                e
            );
        })(p);
    },
    function (t, e) {
        function n(t) {
            return (n =
                "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
                    ? function (t) {
                          return typeof t;
                      }
                    : function (t) {
                          return t && "function" == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype ? "symbol" : typeof t;
                      })(t);
        }
        function o(t, e) {
            return !e || ("object" !== n(e) && "function" != typeof e)
                ? (function (t) {
                      if (void 0 === t) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
                      return t;
                  })(t)
                : e;
        }
        function r(t) {
            return (r = Object.setPrototypeOf
                ? Object.getPrototypeOf
                : function (t) {
                      return t.__proto__ || Object.getPrototypeOf(t);
                  })(t);
        }
        function i(t, e) {
            return (i =
                Object.setPrototypeOf ||
                function (t, e) {
                    return (t.__proto__ = e), t;
                })(t, e);
        }
        function s(t, e) {
            if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function");
        }
        function a(t, e) {
            for (var n = 0; n < e.length; n++) {
                var o = e[n];
                (o.enumerable = o.enumerable || !1), (o.configurable = !0), "value" in o && (o.writable = !0), Object.defineProperty(t, o.key, o);
            }
        }
        var c = (function () {
                function t(e, n) {
                    s(this, t), (this.x = e), (this.y = n);
                }
                var e, n, o;
                return (
                    (e = t),
                    (n = [
                        {
                            key: "set",
                            value: function (t, e) {
                                (this.x = t), (this.y = e);
                            },
                        },
                    ]) && a(e.prototype, n),
                    o && a(e, o),
                    t
                );
            })(),
            u = (function (t) {
                function e() {
                    var t;
                    return s(this, e), ((t = o(this, r(e).call(this, 0, 0))).down = !1), (t.previous = new c(0, 0)), t;
                }
                return (
                    (function (t, e) {
                        if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
                        (t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } })), e && i(t, e);
                    })(e, t),
                    e
                );
            })(c);
        t.exports = { Mouse: u, Point: c };
    },
    function (t, e) {
        var n = { floodFillInterval: 100, maxLineThickness: 50, minLineThickness: 1 };
        (n.lineThicknessRange = n.maxLineThickness - n.minLineThickness), (n.thicknessIncrement = 0.5), (n.minSmoothingFactor = 0.87), (n.initialSmoothingFactor = 0.85), (n.weightSpread = 10), (n.initialThickness = 2), (t.exports = n);
    },
    function (t, e) {
        function n(t) {
            return (
                (function (t) {
                    if (Array.isArray(t)) {
                        for (var e = 0, n = new Array(t.length); e < t.length; e++) n[e] = t[e];
                        return n;
                    }
                })(t) ||
                (function (t) {
                    if (Symbol.iterator in Object(t) || "[object Arguments]" === Object.prototype.toString.call(t)) return Array.from(t);
                })(t) ||
                (function () {
                    throw new TypeError("Invalid attempt to spread non-iterable instance");
                })()
            );
        }
        function o(t, e) {
            for (var n = 0; n < e.length; n++) {
                var o = e[n];
                (o.enumerable = o.enumerable || !1), (o.configurable = !0), "value" in o && (o.writable = !0), Object.defineProperty(t, o.key, o);
            }
        }
        var r = (function () {
            function t() {
                !(function (t, e) {
                    if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function");
                })(this, t),
                    (this.eventListeners = new Map());
            }
            var e, r, i;
            return (
                (e = t),
                (r = [
                    {
                        key: "addEventListener",
                        value: function (t, e) {
                            var n = this.eventListeners.get(t) || new Set();
                            n.add(e), this.eventListeners.set(t, n);
                        },
                    },
                    {
                        key: "removeEventListener",
                        value: function (t, e) {
                            var n = this.eventListeners.get(t);
                            n && n.delete(e);
                        },
                    },
                    {
                        key: "dispatchEvent",
                        value: function (t, e) {
                            var o = this.eventListeners.get(t);
                            o &&
                                n(o).forEach(function (t) {
                                    return t(e);
                                });
                        },
                    },
                ]) && o(e.prototype, r),
                i && o(e, i),
                t
            );
        })();
        t.exports = { AtramentEventTarget: r };
    },
    function (t, e) {
        function n(t) {
            return (
                (function (t) {
                    if (Array.isArray(t)) {
                        for (var e = 0, n = new Array(t.length); e < t.length; e++) n[e] = t[e];
                        return n;
                    }
                })(t) ||
                (function (t) {
                    if (Symbol.iterator in Object(t) || "[object Arguments]" === Object.prototype.toString.call(t)) return Array.from(t);
                })(t) ||
                (function () {
                    throw new TypeError("Invalid attempt to spread non-iterable instance");
                })()
            );
        }
        (e.lineDistance = function (t, e, n, o) {
            var r = Math.pow(n - t, 2),
                i = Math.pow(o - e, 2);
            return Math.sqrt(r + i);
        }),
            (e.hexToRgb = function (t) {
                var e = t.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
                return [parseInt(e[1], 16), parseInt(e[2], 16), parseInt(e[3], 16)];
            }),
            (e.matchColor = function (t, e, n, o, r) {
                return function (i) {
                    var s = t[i],
                        a = t[i + 1],
                        c = t[i + 2],
                        u = t[i + 3];
                    return s === e && a === n && c === o && u === r;
                };
            }),
            (e.colorPixel = function (t, o, r, i, s, a) {
                var c,
                    u = (c = e).matchColor.apply(c, [t].concat(n(s)));
                return function (e) {
                    (t[e] = o),
                        (t[e + 1] = r),
                        (t[e + 2] = i),
                        (t[e + 3] = a),
                        u(e + 4) || ((t[e + 4] = 0.01 * t[e + 4] + 0.99 * o), (t[e + 4 + 1] = 0.01 * t[e + 4 + 1] + 0.99 * r), (t[e + 4 + 2] = 0.01 * t[e + 4 + 2] + 0.99 * i), (t[e + 4 + 3] = 0.01 * t[e + 4 + 3] + 0.99 * a)),
                        u(e - 4) || ((t[e - 4] = 0.01 * t[e - 4] + 0.99 * o), (t[e - 4 + 1] = 0.01 * t[e - 4 + 1] + 0.99 * r), (t[e - 4 + 2] = 0.01 * t[e - 4 + 2] + 0.99 * i), (t[e - 4 + 3] = 0.01 * t[e - 4 + 3] + 0.99 * a));
                };
            });
    },
]);
//# sourceMappingURL=atrament.min.js.map
