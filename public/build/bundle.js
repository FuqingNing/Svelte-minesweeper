
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
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
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
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
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
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
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
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
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
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
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
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
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
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
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    var cssVars = (e,t)=>{let r=new Set(Object.keys(t));return r.forEach(r=>{e.style.setProperty(`--${r}`,t[r]);}),{update(t){const o=new Set(Object.keys(t));o.forEach(o=>{e.style.setProperty(`--${o}`,t[o]),r.delete(o);}),r.forEach(t=>e.style.removeProperty(`--${t}`)),r=o;}}};

    /* src/Cell.svelte generated by Svelte v3.16.7 */
    const file = "src/Cell.svelte";

    // (38:43) 
    function create_if_block_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*bombsNearby*/ ctx[3]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*bombsNearby*/ 8) set_data_dev(t, /*bombsNearby*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(38:43) ",
    		ctx
    	});

    	return block;
    }

    // (36:22) 
    function create_if_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("🚩");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(36:22) ",
    		ctx
    	});

    	return block;
    }

    // (34:4) {#if isBomb && !isHidden}
    function create_if_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("💥");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(34:4) {#if isBomb && !isHidden}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*isBomb*/ ctx[1] && !/*isHidden*/ ctx[0]) return create_if_block;
    		if (/*hasFlag*/ ctx[2]) return create_if_block_1;
    		if (!/*isHidden*/ ctx[0] && /*bombsNearby*/ ctx[3] > 0) return create_if_block_2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "cell svelte-1arzoby");
    			toggle_class(div, "hidden", /*isHidden*/ ctx[0]);
    			add_location(div, file, 27, 0, 571);

    			dispose = [
    				listen_dev(div, "click", /*step*/ ctx[4], false, false, false),
    				listen_dev(div, "contextmenu", /*flag*/ ctx[5], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}

    			if (dirty & /*isHidden*/ 1) {
    				toggle_class(div, "hidden", /*isHidden*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			if (if_block) {
    				if_block.d();
    			}

    			run_all(dispose);
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
    	let { id } = $$props;
    	let { isHidden = true } = $$props;
    	let { isBomb = false } = $$props;
    	let { hasFlag = false } = $$props;
    	let { bombsNearby = 0 } = $$props;
    	const dispatch = createEventDispatcher();

    	function step() {
    		if (!hasFlag) {
    			dispatch("stepInto", { id });
    		}
    	}

    	function flag(event) {
    		event.preventDefault();

    		if (isHidden) {
    			dispatch("toggleFlag", { id });
    		}
    	}

    	const writable_props = ["id", "isHidden", "isBomb", "hasFlag", "bombsNearby"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Cell> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(6, id = $$props.id);
    		if ("isHidden" in $$props) $$invalidate(0, isHidden = $$props.isHidden);
    		if ("isBomb" in $$props) $$invalidate(1, isBomb = $$props.isBomb);
    		if ("hasFlag" in $$props) $$invalidate(2, hasFlag = $$props.hasFlag);
    		if ("bombsNearby" in $$props) $$invalidate(3, bombsNearby = $$props.bombsNearby);
    	};

    	$$self.$capture_state = () => {
    		return {
    			id,
    			isHidden,
    			isBomb,
    			hasFlag,
    			bombsNearby
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(6, id = $$props.id);
    		if ("isHidden" in $$props) $$invalidate(0, isHidden = $$props.isHidden);
    		if ("isBomb" in $$props) $$invalidate(1, isBomb = $$props.isBomb);
    		if ("hasFlag" in $$props) $$invalidate(2, hasFlag = $$props.hasFlag);
    		if ("bombsNearby" in $$props) $$invalidate(3, bombsNearby = $$props.bombsNearby);
    	};

    	return [isHidden, isBomb, hasFlag, bombsNearby, step, flag, id];
    }

    class Cell extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			id: 6,
    			isHidden: 0,
    			isBomb: 1,
    			hasFlag: 2,
    			bombsNearby: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Cell",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*id*/ ctx[6] === undefined && !("id" in props)) {
    			console.warn("<Cell> was created without expected prop 'id'");
    		}
    	}

    	get id() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isHidden() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isHidden(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isBomb() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isBomb(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hasFlag() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hasFlag(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bombsNearby() {
    		throw new Error("<Cell>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bombsNearby(value) {
    		throw new Error("<Cell>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function newBoard(width, height, bombsCount) {
        const cells = [];
        for (let i = 0; i < width * height; i++) {
            cells.push({ isHidden: true });
        }

        for (let i = 0; i < bombsCount; i++) {
            cells[i].isBomb = true;
        }
        cells.sort(() => Math.random() - Math.random()); // Poors man's shuffle.

        for (let i = 1; i <= cells.length; i++) {
            cells[i - 1].id = i;

        }

        return cells
    }

    function checkStatus(cells) {
        const [uncoveredBombs, pendingBombs, pendingCells] = cells.reduce(
            ([ub, pb, pc], cell) => {
                if (!cell.isHidden && cell.isBomb) {
                    return [ub +1, pb, pc]
                }
                if (!cell.hasFlag && cell.isBomb) {
                    return [ub, pb + 1, pc]
                }
                if (!cell.isBomb && cell.isHidden) {
                    return [ub, pb, pc + 1]
                }
                return [ub, pb, pc]
            }, [0, 0, 0]);

        if (uncoveredBombs > 0) {
            return 'lost'
        }
        if (pendingBombs === 0 && pendingCells === 0) {
            return 'win'
        }
        return 'running'
    }

    function stepInto(cellId, game) {
        const cell = get(game, cellId);
        cell.isHidden = false;
        if (!cell.isBomb) {
            uncoverNearby(cell, game);
        }
        return game.cells
    }

    function toggleFlag(cellId, game) {
        const cell = get(game, cellId);
        cell.hasFlag = !cell.hasFlag;
        return game.cells
    }

    function uncoverNearby(cell, game) {
        cell.isHidden = false;
        cell.hasFlag = false;
        const nearby = getNearby(cell.id, game);
        const bombs = nearby.filter(({ isBomb }) => isBomb).length;
        cell.bombsNearby = bombs;
        if (bombs === 0) {
            for (const cell of nearby.filter(({isHidden}) => isHidden)) {
                /* Minesweeper search is naturally recursive, but this
                   implementation could be better. */
                uncoverNearby(cell, game);
            }
        }
    }

    function getNearby(id, game) {
        const { width } = game;
        const nearby = [];
        const getAt = get.bind(undefined, game);

        if (id % width !== 1) {
            nearby.push(
                getAt(id - 1 + width),
                getAt(id - 1),
                getAt(id - 1 - width)
            );
        }
        if (id % width !== 0) {
            nearby.push(
                getAt(id + 1 - width),
                getAt(id + 1),
                getAt(id + 1 + width)
            );
        }
        return [
            ...nearby,
            getAt(id - width),
            getAt(id + width),
        ].filter(cell => cell !== undefined)
    }

    function get(game, id) {
        return game.cells[id - 1]
    }

    /* src/Board.svelte generated by Svelte v3.16.7 */
    const file$1 = "src/Board.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    // (47:4) {#each cells as cell (cell.id)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let current;
    	const cell_spread_levels = [/*cell*/ ctx[13]];
    	let cell_props = {};

    	for (let i = 0; i < cell_spread_levels.length; i += 1) {
    		cell_props = assign(cell_props, cell_spread_levels[i]);
    	}

    	const cell = new Cell({ props: cell_props, $$inline: true });

    	cell.$on("stepInto", function () {
    		if (is_function(/*status*/ ctx[1] === "running"
    		? /*handleCellClick*/ ctx[5]
    		: /*doNothing*/ ctx[7])) (/*status*/ ctx[1] === "running"
    		? /*handleCellClick*/ ctx[5]
    		: /*doNothing*/ ctx[7]).apply(this, arguments);
    	});

    	cell.$on("toggleFlag", function () {
    		if (is_function(/*status*/ ctx[1] === "running"
    		? /*handleToggleFlag*/ ctx[6]
    		: /*doNothing*/ ctx[7])) (/*status*/ ctx[1] === "running"
    		? /*handleToggleFlag*/ ctx[6]
    		: /*doNothing*/ ctx[7]).apply(this, arguments);
    	});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(cell.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(cell, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			const cell_changes = (dirty & /*cells*/ 4)
    			? get_spread_update(cell_spread_levels, [get_spread_object(/*cell*/ ctx[13])])
    			: {};

    			cell.$set(cell_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cell.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cell.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(cell, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(47:4) {#each cells as cell (cell.id)}",
    		ctx
    	});

    	return block;
    }

    // (64:0) {#if showModal}
    function create_if_block$1(ctx) {
    	let div1;
    	let div0;
    	let h2;
    	let t1;
    	let p;
    	let t3;
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Congratulations!";
    			t1 = space();
    			p = element("p");
    			p.textContent = "You have won the game!";
    			t3 = space();
    			button = element("button");
    			button.textContent = "Close";
    			add_location(h2, file$1, 66, 8, 1796);
    			add_location(p, file$1, 67, 8, 1830);
    			attr_dev(button, "class", "svelte-i9fqkk");
    			add_location(button, file$1, 68, 8, 1868);
    			attr_dev(div0, "class", "modal-content svelte-i9fqkk");
    			add_location(div0, file$1, 65, 4, 1760);
    			attr_dev(div1, "class", "modal svelte-i9fqkk");
    			add_location(div1, file$1, 64, 0, 1736);
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[12], false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(div0, t3);
    			append_dev(div0, button);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(64:0) {#if showModal}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div0;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let cssVars_action;
    	let t0;
    	let div1;
    	let button;
    	let t1;
    	let button_disabled_value;
    	let t2;
    	let if_block_anchor;
    	let current;
    	let dispose;
    	let each_value = /*cells*/ ctx[2];
    	const get_key = ctx => /*cell*/ ctx[13].id;

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	let if_block = /*showModal*/ ctx[3] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			div1 = element("div");
    			button = element("button");
    			t1 = text("Restart");
    			t2 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(div0, "class", "board svelte-i9fqkk");
    			add_location(div0, file$1, 41, 0, 1157);
    			button.disabled = button_disabled_value = /*status*/ ctx[1] === "running";
    			attr_dev(button, "class", "restart-button svelte-i9fqkk");
    			add_location(button, file$1, 55, 4, 1559);
    			set_style(div1, "text-align", "center");
    			add_location(div1, file$1, 54, 0, 1517);

    			dispose = [
    				action_destroyer(cssVars_action = cssVars.call(null, div0, /*styleVars*/ ctx[0])),
    				listen_dev(div0, "contextmenu", contextmenu_handler, false, false, false),
    				listen_dev(button, "click", /*handleRestart*/ ctx[4], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button);
    			append_dev(button, t1);
    			insert_dev(target, t2, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const each_value = /*cells*/ ctx[2];
    			group_outros();
    			each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div0, outro_and_destroy_block, create_each_block, null, get_each_context);
    			check_outros();
    			if (cssVars_action && is_function(cssVars_action.update) && dirty & /*styleVars*/ 1) cssVars_action.update.call(null, /*styleVars*/ ctx[0]);

    			if (!current || dirty & /*status*/ 2 && button_disabled_value !== (button_disabled_value = /*status*/ ctx[1] === "running")) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (/*showModal*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t2);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			run_all(dispose);
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

    const contextmenu_handler = e => e.preventDefault();

    function instance$1($$self, $$props, $$invalidate) {
    	let { width = 15 } = $$props;
    	let { height = 12 } = $$props;
    	let { bombsCount = Math.floor(width * height * 0.05) } = $$props;
    	let styleVars = { width, height };
    	let status = "running";
    	let cells = newBoard(width, height, bombsCount);
    	let showModal = false;

    	function getBoardColor(status) {
    		if (status === "lost") return "red";
    		if (status === "win") return "#06799F";
    		return "#FFFFFF";
    	}

    	function handleRestart() {
    		$$invalidate(1, status = "running");
    		$$invalidate(2, cells = newBoard(width, height, bombsCount));
    	}

    	function handleCellClick(event) {
    		$$invalidate(2, cells = stepInto(event.detail.id, { width, height, bombsCount, cells }));
    	}

    	function handleToggleFlag(event) {
    		$$invalidate(2, cells = toggleFlag(event.detail.id, { width, height, bombsCount, cells }));
    	}

    	const doNothing = () => {
    		
    	};

    	const writable_props = ["width", "height", "bombsCount"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Board> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(3, showModal = false);

    	$$self.$set = $$props => {
    		if ("width" in $$props) $$invalidate(8, width = $$props.width);
    		if ("height" in $$props) $$invalidate(9, height = $$props.height);
    		if ("bombsCount" in $$props) $$invalidate(10, bombsCount = $$props.bombsCount);
    	};

    	$$self.$capture_state = () => {
    		return {
    			width,
    			height,
    			bombsCount,
    			styleVars,
    			status,
    			cells,
    			showModal
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("width" in $$props) $$invalidate(8, width = $$props.width);
    		if ("height" in $$props) $$invalidate(9, height = $$props.height);
    		if ("bombsCount" in $$props) $$invalidate(10, bombsCount = $$props.bombsCount);
    		if ("styleVars" in $$props) $$invalidate(0, styleVars = $$props.styleVars);
    		if ("status" in $$props) $$invalidate(1, status = $$props.status);
    		if ("cells" in $$props) $$invalidate(2, cells = $$props.cells);
    		if ("showModal" in $$props) $$invalidate(3, showModal = $$props.showModal);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*cells*/ 4) {
    			 $$invalidate(1, status = checkStatus(cells));
    		}

    		if ($$self.$$.dirty & /*styleVars, status*/ 3) {
    			 $$invalidate(0, styleVars = {
    				...styleVars,
    				color: getBoardColor(status)
    			});
    		}

    		if ($$self.$$.dirty & /*status*/ 2) {
    			 if (status === "win") $$invalidate(3, showModal = true);
    		}
    	};

    	return [
    		styleVars,
    		status,
    		cells,
    		showModal,
    		handleRestart,
    		handleCellClick,
    		handleToggleFlag,
    		doNothing,
    		width,
    		height,
    		bombsCount,
    		getBoardColor,
    		click_handler
    	];
    }

    class Board extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { width: 8, height: 9, bombsCount: 10 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Board",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get width() {
    		throw new Error("<Board>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Board>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Board>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Board>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bombsCount() {
    		throw new Error("<Board>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bombsCount(value) {
    		throw new Error("<Board>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.16.7 */
    const file$2 = "src/App.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let div;
    	let h2;
    	let t3;
    	let ul;
    	let li0;
    	let b0;
    	let t5;
    	let t6;
    	let li1;
    	let b1;
    	let t8;
    	let t9;
    	let p0;
    	let t11;
    	let p1;
    	let t13;
    	let t14;
    	let p2;
    	let current;

    	const board = new Board({
    			props: { width: 20, height: 17 },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Minesweeper";
    			t1 = space();
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "Controls:";
    			t3 = space();
    			ul = element("ul");
    			li0 = element("li");
    			b0 = element("b");
    			b0.textContent = "Left click";
    			t5 = text(": uncover");
    			t6 = space();
    			li1 = element("li");
    			b1 = element("b");
    			b1.textContent = "Right click";
    			t8 = text(": toggle flag");
    			t9 = space();
    			p0 = element("p");
    			p0.textContent = "Click on the board to start the game.";
    			t11 = space();
    			p1 = element("p");
    			p1.textContent = "Rules: You can flag or uncover a cell of the board once, and you cannot click the cell after you flag it.";
    			t13 = space();
    			create_component(board.$$.fragment);
    			t14 = space();
    			p2 = element("p");
    			p2.textContent = "You can only restart the game after finishing a round.";
    			attr_dev(h1, "class", "svelte-1osl93f");
    			add_location(h1, file$2, 5, 1, 64);
    			attr_dev(h2, "class", "svelte-1osl93f");
    			add_location(h2, file$2, 7, 2, 111);
    			add_location(b0, file$2, 9, 7, 144);
    			add_location(li0, file$2, 9, 3, 140);
    			add_location(b1, file$2, 10, 7, 183);
    			add_location(li1, file$2, 10, 3, 179);
    			add_location(ul, file$2, 8, 2, 132);
    			attr_dev(div, "class", "controls svelte-1osl93f");
    			add_location(div, file$2, 6, 1, 86);
    			attr_dev(p0, "class", "svelte-1osl93f");
    			add_location(p0, file$2, 13, 1, 237);
    			attr_dev(p1, "class", "rules svelte-1osl93f");
    			add_location(p1, file$2, 14, 1, 283);
    			attr_dev(p2, "class", "restart-note svelte-1osl93f");
    			add_location(p2, file$2, 16, 1, 447);
    			attr_dev(main, "class", "svelte-1osl93f");
    			add_location(main, file$2, 4, 0, 56);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, div);
    			append_dev(div, h2);
    			append_dev(div, t3);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			append_dev(li0, b0);
    			append_dev(li0, t5);
    			append_dev(ul, t6);
    			append_dev(ul, li1);
    			append_dev(li1, b1);
    			append_dev(li1, t8);
    			append_dev(main, t9);
    			append_dev(main, p0);
    			append_dev(main, t11);
    			append_dev(main, p1);
    			append_dev(main, t13);
    			mount_component(board, main, null);
    			append_dev(main, t14);
    			append_dev(main, p2);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(board.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(board.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(board);
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

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
