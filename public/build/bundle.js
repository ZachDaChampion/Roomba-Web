
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const grid = writable(null);
    const selected = writable(null);
    const selectedStrength = derived([grid, selected], ([$grid, $selected]) => {
        if ($selected === null)
            return null;
        if ($selected.dir === "r")
            return $grid[$selected.row][$selected.col].right;
        return $grid[$selected.row][$selected.col].down;
    });
    const draggingStart = writable(false);
    const draggingGoal = writable(false);

    /* src\Config.svelte generated by Svelte v3.31.0 */
    const file = "src\\Config.svelte";

    function create_fragment(ctx) {
    	let div1;
    	let h20;
    	let t1;
    	let hr0;
    	let t2;
    	let button0;
    	let t4;
    	let button1;
    	let t6;
    	let div0;
    	let h21;
    	let t8;
    	let hr1;
    	let t9;
    	let p0;
    	let t10;
    	let t11_value = (1 / /*$selectedStrength*/ ctx[2]).toFixed(2) + "";
    	let t11;
    	let t12;
    	let p1;
    	let t13;
    	let t14_value = Number(/*$selectedStrength*/ ctx[2]).toFixed(2) + "";
    	let t14;
    	let t15;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Control";
    			t1 = space();
    			hr0 = element("hr");
    			t2 = space();
    			button0 = element("button");
    			button0.textContent = "Generate Path";
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "Follow Path";
    			t6 = space();
    			div0 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Selected Connection";
    			t8 = space();
    			hr1 = element("hr");
    			t9 = space();
    			p0 = element("p");
    			t10 = text("Travel cost: ");
    			t11 = text(t11_value);
    			t12 = space();
    			p1 = element("p");
    			t13 = text("Ease of travel: ");
    			t14 = text(t14_value);
    			t15 = space();
    			input = element("input");
    			add_location(h20, file, 103, 2, 2462);
    			set_style(hr0, "margin-bottom", "16px");
    			add_location(hr0, file, 104, 2, 2482);
    			set_style(button0, "width", "100%");
    			add_location(button0, file, 105, 2, 2521);
    			set_style(button1, "width", "100%");
    			add_location(button1, file, 106, 2, 2575);
    			add_location(h21, file, 111, 4, 2759);
    			set_style(hr1, "margin-bottom", "16px");
    			add_location(hr1, file, 112, 4, 2793);
    			add_location(p0, file, 113, 4, 2834);
    			add_location(p1, file, 114, 4, 2896);
    			attr_dev(input, "type", "range");
    			input.value = /*$selectedStrength*/ ctx[2];
    			attr_dev(input, "min", "0");
    			attr_dev(input, "max", "1");
    			attr_dev(input, "step", ".01");
    			attr_dev(input, "class", "slider svelte-1vxvtvl");
    			add_location(input, file, 115, 4, 2963);
    			set_style(div0, "visibility", /*$selected*/ ctx[1] === null ? "hidden" : "visible");
    			set_style(div0, "margin-top", "64px");
    			add_location(div0, file, 109, 2, 2660);
    			attr_dev(div1, "id", "background");
    			attr_dev(div1, "class", "svelte-1vxvtvl");
    			add_location(div1, file, 101, 0, 2412);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h20);
    			append_dev(div1, t1);
    			append_dev(div1, hr0);
    			append_dev(div1, t2);
    			append_dev(div1, button0);
    			append_dev(div1, t4);
    			append_dev(div1, button1);
    			append_dev(div1, t6);
    			append_dev(div1, div0);
    			append_dev(div0, h21);
    			append_dev(div0, t8);
    			append_dev(div0, hr1);
    			append_dev(div0, t9);
    			append_dev(div0, p0);
    			append_dev(p0, t10);
    			append_dev(p0, t11);
    			append_dev(div0, t12);
    			append_dev(div0, p1);
    			append_dev(p1, t13);
    			append_dev(p1, t14);
    			append_dev(div0, t15);
    			append_dev(div0, input);
    			/*input_binding*/ ctx[4](input);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_handler*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$selectedStrength*/ 4 && t11_value !== (t11_value = (1 / /*$selectedStrength*/ ctx[2]).toFixed(2) + "")) set_data_dev(t11, t11_value);
    			if (dirty & /*$selectedStrength*/ 4 && t14_value !== (t14_value = Number(/*$selectedStrength*/ ctx[2]).toFixed(2) + "")) set_data_dev(t14, t14_value);

    			if (dirty & /*$selectedStrength*/ 4) {
    				prop_dev(input, "value", /*$selectedStrength*/ ctx[2]);
    			}

    			if (dirty & /*$selected*/ 2) {
    				set_style(div0, "visibility", /*$selected*/ ctx[1] === null ? "hidden" : "visible");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			/*input_binding*/ ctx[4](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $selected;
    	let $selectedStrength;
    	let $grid;
    	validate_store(selected, "selected");
    	component_subscribe($$self, selected, $$value => $$invalidate(1, $selected = $$value));
    	validate_store(selectedStrength, "selectedStrength");
    	component_subscribe($$self, selectedStrength, $$value => $$invalidate(2, $selectedStrength = $$value));
    	validate_store(grid, "grid");
    	component_subscribe($$self, grid, $$value => $$invalidate(3, $grid = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Config", slots, []);
    	let slider;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Config> was created with unknown prop '${key}'`);
    	});

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			slider = $$value;
    			$$invalidate(0, slider);
    		});
    	}

    	const input_handler = () => {
    		if ($selected === null) return; else if ($selected.dir === "r") set_store_value(grid, $grid[$selected.row][$selected.col].right = Number(slider.value), $grid); else if ($selected.dir === "d") set_store_value(grid, $grid[$selected.row][$selected.col].down = Number(slider.value), $grid);
    	};

    	$$self.$capture_state = () => ({
    		grid,
    		selected,
    		selectedStrength,
    		slider,
    		$selected,
    		$selectedStrength,
    		$grid
    	});

    	$$self.$inject_state = $$props => {
    		if ("slider" in $$props) $$invalidate(0, slider = $$props.slider);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [slider, $selected, $selectedStrength, $grid, input_binding, input_handler];
    }

    class Config extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Config",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\Endpoint.svelte generated by Svelte v3.31.0 */
    const file$1 = "src\\Endpoint.svelte";

    function create_fragment$1(ctx) {
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "cell svelte-1p8makd");
    			set_style(span, "background-color", /*color*/ ctx[0]);
    			set_style(span, "left", /*pos*/ ctx[4].x + "px");
    			set_style(span, "top", /*pos*/ ctx[4].y + "px");
    			add_location(span, file$1, 47, 0, 1244);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			/*span_binding*/ ctx[10](span);

    			if (!mounted) {
    				dispose = listen_dev(span, "mousedown", /*mousedown_handler*/ ctx[11], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*color*/ 1) {
    				set_style(span, "background-color", /*color*/ ctx[0]);
    			}

    			if (dirty & /*pos*/ 16) {
    				set_style(span, "left", /*pos*/ ctx[4].x + "px");
    			}

    			if (dirty & /*pos*/ 16) {
    				set_style(span, "top", /*pos*/ ctx[4].y + "px");
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			/*span_binding*/ ctx[10](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function clamp(num, min, max) {
    	return num < min ? min : num > max ? max : num;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $draggingvar,
    		$$unsubscribe_draggingvar = noop,
    		$$subscribe_draggingvar = () => ($$unsubscribe_draggingvar(), $$unsubscribe_draggingvar = subscribe(draggingvar, $$value => $$invalidate(5, $draggingvar = $$value)), draggingvar);

    	$$self.$$.on_destroy.push(() => $$unsubscribe_draggingvar());
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Endpoint", slots, []);
    	
    	let { color } = $$props;
    	let { draggingvar } = $$props;
    	validate_store(draggingvar, "draggingvar");
    	$$subscribe_draggingvar();
    	let { x } = $$props;
    	let { y } = $$props;
    	let { gridW } = $$props;
    	let { gridH } = $$props;
    	let cell;
    	let origOffset;
    	let offset = { x: 0, y: 0 };
    	let pos = { x: x * 44, y: y * 44 };

    	onMount(() => {
    		let rect = cell.getBoundingClientRect();

    		origOffset = {
    			x: rect.left + window.pageXOffset - pos.x,
    			y: rect.top + window.pageYOffset - pos.y
    		};
    	});

    	document.onmousemove = event => {
    		if ($draggingvar) {
    			event.preventDefault();

    			$$invalidate(4, pos = {
    				x: clamp(Math.round((event.clientX - offset.x - origOffset.x + window.pageXOffset) / 44) * 44, 0, (gridW - 1) * 44),
    				y: clamp(Math.round((event.clientY - offset.y - origOffset.y + window.pageYOffset) / 44) * 44, 0, (gridH - 1) * 44)
    			});
    		}
    	};

    	const writable_props = ["color", "draggingvar", "x", "y", "gridW", "gridH"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Endpoint> was created with unknown prop '${key}'`);
    	});

    	function span_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			cell = $$value;
    			$$invalidate(2, cell);
    		});
    	}

    	const mousedown_handler = event => {
    		event.preventDefault();
    		let rect = cell.getBoundingClientRect();

    		$$invalidate(3, offset = {
    			x: event.clientX - rect.left,
    			y: event.clientY - rect.top
    		});

    		set_store_value(draggingvar, $draggingvar = true, $draggingvar);
    	};

    	$$self.$$set = $$props => {
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    		if ("draggingvar" in $$props) $$subscribe_draggingvar($$invalidate(1, draggingvar = $$props.draggingvar));
    		if ("x" in $$props) $$invalidate(6, x = $$props.x);
    		if ("y" in $$props) $$invalidate(7, y = $$props.y);
    		if ("gridW" in $$props) $$invalidate(8, gridW = $$props.gridW);
    		if ("gridH" in $$props) $$invalidate(9, gridH = $$props.gridH);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		color,
    		draggingvar,
    		x,
    		y,
    		gridW,
    		gridH,
    		cell,
    		origOffset,
    		offset,
    		pos,
    		clamp,
    		$draggingvar
    	});

    	$$self.$inject_state = $$props => {
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    		if ("draggingvar" in $$props) $$subscribe_draggingvar($$invalidate(1, draggingvar = $$props.draggingvar));
    		if ("x" in $$props) $$invalidate(6, x = $$props.x);
    		if ("y" in $$props) $$invalidate(7, y = $$props.y);
    		if ("gridW" in $$props) $$invalidate(8, gridW = $$props.gridW);
    		if ("gridH" in $$props) $$invalidate(9, gridH = $$props.gridH);
    		if ("cell" in $$props) $$invalidate(2, cell = $$props.cell);
    		if ("origOffset" in $$props) origOffset = $$props.origOffset;
    		if ("offset" in $$props) $$invalidate(3, offset = $$props.offset);
    		if ("pos" in $$props) $$invalidate(4, pos = $$props.pos);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		color,
    		draggingvar,
    		cell,
    		offset,
    		pos,
    		$draggingvar,
    		x,
    		y,
    		gridW,
    		gridH,
    		span_binding,
    		mousedown_handler
    	];
    }

    class Endpoint extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			color: 0,
    			draggingvar: 1,
    			x: 6,
    			y: 7,
    			gridW: 8,
    			gridH: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Endpoint",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*color*/ ctx[0] === undefined && !("color" in props)) {
    			console.warn("<Endpoint> was created without expected prop 'color'");
    		}

    		if (/*draggingvar*/ ctx[1] === undefined && !("draggingvar" in props)) {
    			console.warn("<Endpoint> was created without expected prop 'draggingvar'");
    		}

    		if (/*x*/ ctx[6] === undefined && !("x" in props)) {
    			console.warn("<Endpoint> was created without expected prop 'x'");
    		}

    		if (/*y*/ ctx[7] === undefined && !("y" in props)) {
    			console.warn("<Endpoint> was created without expected prop 'y'");
    		}

    		if (/*gridW*/ ctx[8] === undefined && !("gridW" in props)) {
    			console.warn("<Endpoint> was created without expected prop 'gridW'");
    		}

    		if (/*gridH*/ ctx[9] === undefined && !("gridH" in props)) {
    			console.warn("<Endpoint> was created without expected prop 'gridH'");
    		}
    	}

    	get color() {
    		throw new Error("<Endpoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Endpoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get draggingvar() {
    		throw new Error("<Endpoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set draggingvar(value) {
    		throw new Error("<Endpoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get x() {
    		throw new Error("<Endpoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set x(value) {
    		throw new Error("<Endpoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get y() {
    		throw new Error("<Endpoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set y(value) {
    		throw new Error("<Endpoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gridW() {
    		throw new Error("<Endpoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gridW(value) {
    		throw new Error("<Endpoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gridH() {
    		throw new Error("<Endpoint>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gridH(value) {
    		throw new Error("<Endpoint>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Grid.svelte generated by Svelte v3.31.0 */
    const file$2 = "src\\Grid.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[11] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[11] = i;
    	return child_ctx;
    }

    // (93:8) {#if $grid[row][col].right !== null}
    function create_if_block_1(ctx) {
    	let span;
    	let span_class_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*row*/ ctx[9], /*col*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");

    			attr_dev(span, "class", span_class_value = "connection-right" + (/*$selected*/ ctx[3] !== null && /*$selected*/ ctx[3].row === /*row*/ ctx[9] && /*$selected*/ ctx[3].col === /*col*/ ctx[11] && /*$selected*/ ctx[3].dir === "r"
    			? " highlighted"
    			: "") + " svelte-2xcvg5");

    			set_style(span, "left", /*col*/ ctx[11] * 44 + "px");
    			set_style(span, "top", /*row*/ ctx[9] * 44 + "px");
    			set_style(span, "background-color", derivePathColor(/*$grid*/ ctx[2][/*row*/ ctx[9]][/*col*/ ctx[11]].right));
    			add_location(span, file$2, 93, 10, 2127);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$selected*/ 8 && span_class_value !== (span_class_value = "connection-right" + (/*$selected*/ ctx[3] !== null && /*$selected*/ ctx[3].row === /*row*/ ctx[9] && /*$selected*/ ctx[3].col === /*col*/ ctx[11] && /*$selected*/ ctx[3].dir === "r"
    			? " highlighted"
    			: "") + " svelte-2xcvg5")) {
    				attr_dev(span, "class", span_class_value);
    			}

    			if (dirty & /*$grid*/ 4) {
    				set_style(span, "background-color", derivePathColor(/*$grid*/ ctx[2][/*row*/ ctx[9]][/*col*/ ctx[11]].right));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(93:8) {#if $grid[row][col].right !== null}",
    		ctx
    	});

    	return block;
    }

    // (101:8) {#if $grid[row][col].down !== null}
    function create_if_block(ctx) {
    	let span;
    	let span_class_value;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[5](/*row*/ ctx[9], /*col*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			span = element("span");

    			attr_dev(span, "class", span_class_value = "connection-bottom" + (/*$selected*/ ctx[3] !== null && /*$selected*/ ctx[3].row === /*row*/ ctx[9] && /*$selected*/ ctx[3].col === /*col*/ ctx[11] && /*$selected*/ ctx[3].dir === "d"
    			? " highlighted"
    			: "") + " svelte-2xcvg5");

    			set_style(span, "left", /*col*/ ctx[11] * 44 + "px");
    			set_style(span, "top", /*row*/ ctx[9] * 44 + "px");
    			set_style(span, "background-color", derivePathColor(/*$grid*/ ctx[2][/*row*/ ctx[9]][/*col*/ ctx[11]].down));
    			add_location(span, file$2, 101, 10, 2589);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$selected*/ 8 && span_class_value !== (span_class_value = "connection-bottom" + (/*$selected*/ ctx[3] !== null && /*$selected*/ ctx[3].row === /*row*/ ctx[9] && /*$selected*/ ctx[3].col === /*col*/ ctx[11] && /*$selected*/ ctx[3].dir === "d"
    			? " highlighted"
    			: "") + " svelte-2xcvg5")) {
    				attr_dev(span, "class", span_class_value);
    			}

    			if (dirty & /*$grid*/ 4) {
    				set_style(span, "background-color", derivePathColor(/*$grid*/ ctx[2][/*row*/ ctx[9]][/*col*/ ctx[11]].down));
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(101:8) {#if $grid[row][col].down !== null}",
    		ctx
    	});

    	return block;
    }

    // (92:6) {#each { length: cols } as _, col}
    function create_each_block_3(ctx) {
    	let t;
    	let if_block1_anchor;
    	let if_block0 = /*$grid*/ ctx[2][/*row*/ ctx[9]][/*col*/ ctx[11]].right !== null && create_if_block_1(ctx);
    	let if_block1 = /*$grid*/ ctx[2][/*row*/ ctx[9]][/*col*/ ctx[11]].down !== null && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*$grid*/ ctx[2][/*row*/ ctx[9]][/*col*/ ctx[11]].right !== null) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*$grid*/ ctx[2][/*row*/ ctx[9]][/*col*/ ctx[11]].down !== null) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(92:6) {#each { length: cols } as _, col}",
    		ctx
    	});

    	return block;
    }

    // (90:2) {#each { length: rows } as _, row}
    function create_each_block_2(ctx) {
    	let div;
    	let t;
    	let each_value_3 = { length: /*cols*/ ctx[1] };
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			set_style(div, "display", "flex");
    			set_style(div, "flex-direction", "row");
    			add_location(div, file$2, 90, 4, 1978);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$selected, derivePathColor, $grid, cols*/ 14) {
    				each_value_3 = { length: /*cols*/ ctx[1] };
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(90:2) {#each { length: rows } as _, row}",
    		ctx
    	});

    	return block;
    }

    // (117:6) {#each { length: cols } as _, col}
    function create_each_block_1(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			attr_dev(span, "class", "cell svelte-2xcvg5");
    			add_location(span, file$2, 116, 40, 3231);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(117:6) {#each { length: cols } as _, col}",
    		ctx
    	});

    	return block;
    }

    // (115:2) {#each { length: rows } as _, row}
    function create_each_block(ctx) {
    	let div;
    	let t;
    	let each_value_1 = { length: /*cols*/ ctx[1] };
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			set_style(div, "display", "flex");
    			set_style(div, "flex-direction", "row");
    			add_location(div, file$2, 115, 4, 3140);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*cols*/ 2) {
    				const old_length = each_value_1.length;
    				each_value_1 = { length: /*cols*/ ctx[1] };
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = old_length; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (!each_blocks[i]) {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (i = each_value_1.length; i < old_length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(115:2) {#each { length: rows } as _, row}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div0;
    	let t;
    	let div1;
    	let each_value_2 = { length: /*rows*/ ctx[0] };
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value = { length: /*rows*/ ctx[0] };
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			set_style(div0, "display", "flex");
    			set_style(div0, "flex-direction", "column");
    			set_style(div0, "position", "absolute");
    			set_style(div0, "z-index", "1");
    			add_location(div0, file$2, 87, 0, 1847);
    			set_style(div1, "display", "flex");
    			set_style(div1, "flex-direction", "column");
    			add_location(div1, file$2, 113, 0, 3044);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div0, null);
    			}

    			insert_dev(target, t, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*cols, $selected, derivePathColor, $grid, rows*/ 15) {
    				each_value_2 = { length: /*rows*/ ctx[0] };
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty & /*cols, rows*/ 3) {
    				each_value = { length: /*rows*/ ctx[0] };
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function derivePathColor(weight) {
    	if (weight < 0) weight = 0;
    	if (weight > 1) weight = 1;
    	let val = Math.round((1 - weight) * 255);
    	return `rgb(${val}, ${val}, ${val})`;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $grid;
    	let $selected;
    	validate_store(grid, "grid");
    	component_subscribe($$self, grid, $$value => $$invalidate(2, $grid = $$value));
    	validate_store(selected, "selected");
    	component_subscribe($$self, selected, $$value => $$invalidate(3, $selected = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Grid", slots, []);
    	let { rows } = $$props;
    	let { cols } = $$props;

    	// generate grid
    	const result = Array(Array(0));

    	for (let i = 0; i < rows; ++i) {
    		result.push(Array(0));

    		for (let j = 0; j < cols; ++j) {
    			result[i].push({
    				row: i,
    				col: j,
    				down: i < rows - 1 ? 1 - i / rows : null,
    				right: j < cols - 1 ? 1 - i / rows : null
    			});
    		}
    	}

    	set_store_value(grid, $grid = result, $grid);
    	const writable_props = ["rows", "cols"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Grid> was created with unknown prop '${key}'`);
    	});

    	const click_handler = (row, col) => {
    		set_store_value(selected, $selected = { row, col, dir: "r" }, $selected);
    	};

    	const click_handler_1 = (row, col) => {
    		set_store_value(selected, $selected = { row, col, dir: "d" }, $selected);
    	};

    	$$self.$$set = $$props => {
    		if ("rows" in $$props) $$invalidate(0, rows = $$props.rows);
    		if ("cols" in $$props) $$invalidate(1, cols = $$props.cols);
    	};

    	$$self.$capture_state = () => ({
    		grid,
    		selected,
    		rows,
    		cols,
    		result,
    		derivePathColor,
    		$grid,
    		$selected
    	});

    	$$self.$inject_state = $$props => {
    		if ("rows" in $$props) $$invalidate(0, rows = $$props.rows);
    		if ("cols" in $$props) $$invalidate(1, cols = $$props.cols);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [rows, cols, $grid, $selected, click_handler, click_handler_1];
    }

    class Grid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { rows: 0, cols: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Grid",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*rows*/ ctx[0] === undefined && !("rows" in props)) {
    			console.warn("<Grid> was created without expected prop 'rows'");
    		}

    		if (/*cols*/ ctx[1] === undefined && !("cols" in props)) {
    			console.warn("<Grid> was created without expected prop 'cols'");
    		}
    	}

    	get rows() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rows(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cols() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cols(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.31.0 */
    const file$3 = "src\\App.svelte";

    function create_fragment$3(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div1;
    	let grid;
    	let t2;
    	let endpoint0;
    	let t3;
    	let endpoint1;
    	let t4;
    	let div0;
    	let t5;
    	let config;
    	let current;
    	let mounted;
    	let dispose;

    	grid = new Grid({
    			props: { rows: "15", cols: "15" },
    			$$inline: true
    		});

    	endpoint0 = new Endpoint({
    			props: {
    				color: "#0f0",
    				draggingvar: draggingStart,
    				x: "0",
    				y: "0",
    				gridW: "15",
    				gridH: "15"
    			},
    			$$inline: true
    		});

    	endpoint1 = new Endpoint({
    			props: {
    				color: "#f00",
    				draggingvar: draggingGoal,
    				x: "14",
    				y: "14",
    				gridW: "15",
    				gridH: "15"
    			},
    			$$inline: true
    		});

    	config = new Config({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Roomba Control Panel";
    			t1 = space();
    			div1 = element("div");
    			create_component(grid.$$.fragment);
    			t2 = space();
    			create_component(endpoint0.$$.fragment);
    			t3 = space();
    			create_component(endpoint1.$$.fragment);
    			t4 = space();
    			div0 = element("div");
    			t5 = space();
    			create_component(config.$$.fragment);
    			add_location(h1, file$3, 27, 1, 478);
    			set_style(div0, "margin", "auto");
    			add_location(div0, file$3, 44, 2, 846);
    			set_style(div1, "display", "flex");
    			set_style(div1, "flex-direction", "row");
    			set_style(div1, "position", "relative");
    			add_location(div1, file$3, 28, 1, 510);
    			attr_dev(main, "class", "svelte-1h6otfa");
    			add_location(main, file$3, 22, 0, 389);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div1);
    			mount_component(grid, div1, null);
    			append_dev(div1, t2);
    			mount_component(endpoint0, div1, null);
    			append_dev(div1, t3);
    			mount_component(endpoint1, div1, null);
    			append_dev(div1, t4);
    			append_dev(div1, div0);
    			append_dev(div1, t5);
    			mount_component(config, div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(main, "mouseup", /*mouseup_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(grid.$$.fragment, local);
    			transition_in(endpoint0.$$.fragment, local);
    			transition_in(endpoint1.$$.fragment, local);
    			transition_in(config.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(grid.$$.fragment, local);
    			transition_out(endpoint0.$$.fragment, local);
    			transition_out(endpoint1.$$.fragment, local);
    			transition_out(config.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(grid);
    			destroy_component(endpoint0);
    			destroy_component(endpoint1);
    			destroy_component(config);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $draggingStart;
    	let $draggingGoal;
    	validate_store(draggingStart, "draggingStart");
    	component_subscribe($$self, draggingStart, $$value => $$invalidate(0, $draggingStart = $$value));
    	validate_store(draggingGoal, "draggingGoal");
    	component_subscribe($$self, draggingGoal, $$value => $$invalidate(1, $draggingGoal = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const mouseup_handler = () => {
    		set_store_value(draggingStart, $draggingStart = false, $draggingStart);
    		set_store_value(draggingGoal, $draggingGoal = false, $draggingGoal);
    	};

    	$$self.$capture_state = () => ({
    		Config,
    		Endpoint,
    		Grid,
    		draggingStart,
    		draggingGoal,
    		$draggingStart,
    		$draggingGoal
    	});

    	return [$draggingStart, $draggingGoal, mouseup_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {},
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
