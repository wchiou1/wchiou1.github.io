/*
 * TODO:
 * - export patterns
 * - remember settings in the hash or offer link
 * - life 1.05 is currently broken
 * - better mobile handling: allow scrolling, run with less fps
 * - jump to coordinate
 * - make screenshots, maybe gifs
 * - allow people to upload patterns
 * - maybe more than 2 states (non-life)
 * - implement mcell import for huge patterns
 * - fail-safe http requests and pattern parsing
 * - restore meta life
 */

"use strict";




function MagicMain(brain_pattern,regions,chemdata)
{
	var
    /** @const */
    DEFAULT_BORDER = 0,
    /** @const */
    DEFAULT_FPS = 20;

	var initialTitle = document.title;

	var

		/**
		 * which pattern file is currently loaded
		 * @type {{title: String, urls, comment, view_url, source_url}}
		 * */
		current_pattern,

		// functions which is called when the pattern stops running
		/** @type {function()|undefined} */	onstop,

		last_mouse_x,

		last_mouse_y,

		mouse_set,

		// is the game running ?

		/** @type {boolean} */
		running = false,
		/** @type {number} */
		max_fps,

		// has the pattern list been loaded
		/** @type {boolean} */
		patterns_loaded = false,

		/**
		 * path to the folder with all patterns
		 * @const
		 */
		pattern_path = "examples/",

		loaded = false,

		life = new LifeUniverse(),
		drawer = new LifeCanvasDrawer(life,brain_pattern,regions,chemdata),

		// example setups which are run at startup
		// loaded from examples/
		/** @type {Array.<string>} */
		examples = (
			"primer,1"
		).split("|");
		
		//Setup the 4d array which will contain what regions are where
		drawer.setupRegions(brain_pattern,regions);
		//Use the averages from the drawer to create the buttons
		EventsInit();
		//Now that the buttons are created, load the lookup table(drawer will automatically load the buttons afterward)
		drawer.loadLookupTable();
	/** @type {function(function())} */
	var nextFrame =
		window.requestAnimationFrame ||
		window.webkitRequestAnimationFrame ||
		window.mozRequestAnimationFrame ||
		setTimeout;

    // setup
	this.life=life;


	if(loaded)
	{
		// onload has been called already
		return;
	}

	loaded = true;

	if(!drawer.init(document.body))
	{
		set_text($("notice").getElementsByTagName("h4")[0],
			"Canvas-less browsers are not supported. I'm sorry for that.");
		return;
	}

	init_ui();

	drawer.set_size(window.innerWidth-2, window.innerHeight-2);
	drawer.set_overlay(150,150);
	reset_settings();


	// This gets called, when a pattern is loaded.
	// It has to be called at least once before anything can happen.
	// Since we always load a pattern, it's not necessary at this point.
	//life.clear_pattern();

	// production setup
	// loads a pattern defined by ?pattern=filename (without extension)
	// or a random small pattern instead
	var query = location.search.substr(1).split("&"),
		param,
		parameters = {};

	for(var i = 0; i < query.length; i++)
	{
		param = query[i].split("=");

		parameters[param[0]] = param[1];
	}

	if(parameters["step"] && /^\d+$/.test(parameters["step"]))
	{
		var step_parameter = Math.round(Math.log(Number(parameters["step"])) / Math.LN2);

		life.set_step(step_parameter);
	}

	let pattern_parameter = parameters["pattern"];
	let pattern_parameter_looks_good = pattern_parameter && /^[a-z0-9_\.]+$/.test(pattern_parameter);

	let gist = parameters["gist"];
	if(gist && /^[a-fA-F0-9]+$/.test(gist))
	{
		show_overlay("loading_popup");
		let callback_name = "finish_load_gist" + (2147483647 * Math.random() | 0);
		let jsonp_url = "https://api.github.com/gists/" + gist + "?callback=" + callback_name;

		window[callback_name] = function(result)
		{
			let files = result["data"]["files"];

			if(files)
			{
				for(let filename of Object.keys(files))
				{
					let file = files[filename];
					let direct_url = file["raw_url"];
					let view_url = "https://copy.sh/life/?gist=" + gist;
					setup_pattern(file["content"], undefined, direct_url, view_url, filename);
				}
			}
			else
			{
				if(pattern_parameter_looks_good)
				{
					try_load_pattern(pattern_parameter);
				}
				else
				{
					load_random();
				}
			}
		};
		let script = document.createElement("script");
		script.src = jsonp_url;
		document.getElementsByTagName("head")[0].appendChild(script)
	}
	else if(pattern_parameter_looks_good)
	{
		if(parameters["meta"] === "1")
		{
			try_load_meta();
		}
		else
		{
			// a pattern name has been given as a parameter
			// try to load it, fallback to random pattern

			try_load_pattern(pattern_parameter);
		}
	}
	else
	{
		load_random();
	}

	if(parameters["noui"] === "1")
	{
		var elements = [
			"statusbar", "about_button", "examples_menu",
			"import_button", "settings_button", "zoomout_button",
			"zoomin_button", "clear_button", "superstep_button",
			"step_button", "rewind_button"
		];

		for(var i = 0; i < elements.length; i++)
		{
			$(elements[i]).style.display = "none";
		}
	}

	if(parameters["fps"] && /^\d+$/.test(parameters["fps"]))
	{
		max_fps = +parameters["fps"];
	}

	

	//Functions

	function EventsInit(){
		//Get the averages from the drawer
		console.log("Loading "+drawer.region_averages.length+" regions");
		
		var drop_down = document.getElementById("model-changer");
		addEventHandler(drop_down,'click',function(){handleDropdown();});
		addEventHandler(document.getElementById("star"),'click',function(){changeModel(drawer,"Star");});
		addEventHandler(document.getElementById("bars"),'click',function(){changeModel(drawer,"Bars");});
		addEventHandler(document.getElementById("spatial"),'click',function(){changeModel(drawer,"Spatial");});
	
		//Iterate through them(130)
		for(var i=0;i<drawer.region_averages.length;i++){
			//First check if the average even exists
			if(!isNaN(drawer.region_averages[i].x)||!isNaN(drawer.region_averages[i].y)){
				var div = document.createElement("div");
				div.className="button";
				div.id="button"+(i+1);
				document.getElementById("buttons").appendChild(div);
				let temp_var = i;
				addEventHandler(div,'click',function(){changeRegion(drawer,temp_var+1);});
			}
			else
				console.log("No average found for region "+(i+1));
		}

		function cancel(e) {
		   e.preventDefault(); 
		}
		
	}
	function changeModel(drawer,model){
		console.log(drawer);
		drawer.changeModel(model);
		hideDropdown();
	}
	
	function hideDropdown(){
		var dropdowns = document.getElementsByClassName("dropdown-content");
		var i;
		for (i = 0; i < dropdowns.length; i++) {
			var openDropdown = dropdowns[i];
			if (openDropdown.classList.contains('show')) {
				openDropdown.classList.remove('show');
			}
		}
	}
	function handleDropdown(){
		document.getElementById("myDropdown").classList.toggle("show");
	}
	function changeRegion(drawer,region_num){
		drawer.changeSelectedRegion(region_num);
	}
	function addEventHandler(obj, evt, handler) {
		if(obj.addEventListener) {
			// W3C method
			obj.addEventListener(evt, handler, false);
		} else if(obj.attachEvent) {
			// IE method.
			obj.attachEvent('on'+evt, handler);
		} else {
			// Old school method.
			obj['on'+evt] = handler;
		}
	}
	
	
	function try_load_meta()
	{
		// loading metapixels is broken now, keep this for later
		load_random();

		/*
		var otca_on, otca_off, otca_pattern;

		show_overlay("loading_popup");
		http_get_multiple([
			{
				url : pattern_path + "otcametapixel.rle",
				onready : function(result)
				{
					var field = formats.parse_rle(result).field;

					life.move_field(field, -5, -5);
					life.setup_field(field);

					otca_on = life.root.se.nw;
				}
			},
			{
				url : pattern_path + "otcametapixeloff.rle",
				onready : function(result)
				{
					var field = formats.parse_rle(result).field;

					life.move_field(field, -5, -5);
					life.setup_field(field);

					otca_off = life.root.se.nw;
				}
			},
			{
				url : pattern_path + pattern_parameter + ".rle",
				onready : function(result)
				{
					otca_pattern = formats.parse_rle(result).field;
				}
			}
		],
		function()
		{
			load_otca(otca_on, otca_off, otca_pattern);
		},
		function()
		{
			// fallback to random pattern
			load_random();
		});
		*/
	}

	function try_load_pattern(id)
	{
		show_overlay("loading_popup");
		http_get(
			rle_link(id),
			function(text)
			{
				//console.profile("main setup");
				setup_pattern(text, pattern_parameter);
				//console.profileEnd("main setup");
			},
			function()
			{
				load_random();
			}
		);
	}

	function load_random()
	{
		var random_pattern = examples[Math.random() * examples.length | 0].split(",")[0];

		
		http_get(
			rle_link(random_pattern),
			function(text) {
				setup_pattern(text, random_pattern);
			}
		);
	}


	function init_ui()
	{

		var style_element = document.createElement("style");
		document.head.appendChild(style_element);


		drawer.canvas.ondblclick = function(e)
		{
			drawer.zoom(false, e.clientX, e.clientY);

			update_hud();
			lazy_redraw(life.root);
			return false;
		};


		drawer.canvas.onmousedown = function(e)
		{
			hideDropdown();
			
			
			if(e.which === 3 || e.which === 2)
			{
				var coords = drawer.pixel2cell(e.clientX, e.clientY);

				mouse_set = !life.get_bit(coords.x, coords.y);

				window.addEventListener("mousemove", do_field_draw, true);
				do_field_draw(e);
			}
			else if(e.which === 1)
			{
				last_mouse_x = e.clientX;
				last_mouse_y = e.clientY;
				//console.log("start", e.clientX, e.clientY);

				window.addEventListener("mousemove", do_field_move, true);

				(function redraw()
				{
					if(last_mouse_x !== null)
					{
						requestAnimationFrame(redraw);
					}

					lazy_redraw(life.root,brain_pattern);
				})();
			}

			return false;
		};

		drawer.canvas.addEventListener("touchstart", function(e)
		{
			// left mouse simulation
			var ev = {
				which: 1,
				clientX: e.changedTouches[0].clientX,
				clientY: e.changedTouches[0].clientY,
			};

			drawer.canvas.onmousedown(ev);

			e.preventDefault();
		}, false);

		drawer.canvas.addEventListener("touchmove", function(e)
		{
			var ev = {
				clientX: e.changedTouches[0].clientX,
				clientY: e.changedTouches[0].clientY,
			};

			do_field_move(ev);

			e.preventDefault();
		}, false);

		drawer.canvas.addEventListener("touchend", function(e)
		{
			window.onmouseup(e);
			e.preventDefault();
		}, false);

		drawer.canvas.addEventListener("touchcancel", function(e)
		{
			window.onmouseup(e);
			e.preventDefault();
		}, false);

		window.onmouseup = function(e)
		{
			last_mouse_x = null;
			last_mouse_y = null;

			window.removeEventListener("mousemove", do_field_draw, true);
			window.removeEventListener("mousemove", do_field_move, true);
		}

		/*window.onmousemove = function(e)
		{
			var coords = drawer.pixel2cell(e.clientX, e.clientY);

			set_text($("label_mou"), coords.x + ", " + coords.y);
			fix_width($("label_mou"));
		}
		*/

		drawer.canvas.oncontextmenu = function(e)
		{
			return false;
		};

		drawer.canvas.onmousewheel = function(e)
		{
			e.preventDefault();
			drawer.zoom((e.wheelDelta || -e.detail) < 0, e.clientX, e.clientY);

			
			lazy_redraw(life.root,brain_pattern);
			return false;
		}

		drawer.canvas.addEventListener("DOMMouseScroll", drawer.canvas.onmousewheel, false);

		window.onkeydown = function(e)
		{
			var chr = e.which,
				do_redraw = false,
				target = e.target.nodeName;

			//console.log(e.target)
			//console.log(chr + " " + e.charCode + " " + e.keyCode);

			if(target === "INPUT" || target === "TEXTAREA")
			{
				return true;
			}

			if(e.ctrlKey || e.shiftKey || e.altKey)
			{
				return true;
			}

			if(chr === 37 || chr === 72)
			{
				drawer.move(15, 0);
				do_redraw = true;
			}
			else if(chr === 38 || chr === 75)
			{
				drawer.move(0, 15);
				do_redraw = true;
			}
			else if(chr === 39 || chr === 76)
			{
				drawer.move(-15, 0);
				do_redraw = true;
			}
			else if(chr === 40 || chr === 74)
			{
				drawer.move(0, -15);
				do_redraw = true;
			}
			else if(chr === 27)
			{
				// escape
				hide_overlay();
				return false;
			}
			else if(chr === 13)
			{
				// enter
				$("run").onclick();
				return false;
			}
			else if(chr === 32)
			{
				// space
				if(!running)
				{
					step(true);
				}
				return false;
			}
			else if(chr === 189 || chr === 173 || chr === 109)
			{
				// -
				drawer.zoom_centered(true);
				do_redraw = true;
			}
			else if(chr === 187 || chr === 61)
			{
				// + and =
				drawer.zoom_centered(false);
				do_redraw = true;
			}
			else if(chr === 8)
			{
				// backspace
				$("rewind_button").onclick();
				return false;
			}
			else if(chr === 219 || chr === 221)
			{
				// [ ]
				var step = life.step;

				if(chr === 219)
					step--;
				else
					step++;

				if(step >= 0)
				{
					life.set_step(step);
					set_text($("label_step"), Math.pow(2, step));
				}

				return false;
			}

			if(do_redraw)
			{
				lazy_redraw(life.root,brain_pattern);

				return false;
			}

			return true;
		};
		

		function show_pattern_chooser()
		{
			if(patterns_loaded)
			{
				show_overlay("pattern_chooser");
				return;
			}

			patterns_loaded = true;

			if(false)
			{
				var frame = document.createElement("iframe");
				frame.src = "examples/";
				frame.id = "example_frame";
				$("pattern_list").appendChild(frame);

				show_overlay("pattern_chooser");

				window["load_pattern"] = function(id)
				{
					
					http_get(rle_link(id), function(text)
					{
						setup_pattern(text, id);
						set_query(id);
						show_alert(current_pattern);
						life.set_step(0);
						set_text($("label_step"), "1");
					});
				}
			}
			else
			{
				patterns_loaded = true;

				
				http_get(pattern_path + "list", function(text)
				{
					var patterns = text.split("\n"),
						list = $("pattern_list");

					show_overlay("pattern_chooser");

					patterns.forEach(function(pattern)
					{
						var
							name = pattern.split(" ")[0],
							size = pattern.split(" ")[1],
							name_element = document.createElement("div"),
							size_element = document.createElement("span");

						set_text(name_element, name);
						set_text(size_element, size);
						size_element.className = "size";

						name_element.appendChild(size_element);
						list.appendChild(name_element);

						name_element.onclick = function()
						{
							
							http_get(rle_link(name), function(text)
							{
								setup_pattern(text, name);
								set_query(name);
								show_alert(current_pattern);

								life.set_step(0);
								set_text($("label_step"), "1");
							});
						}
					});
				});
			}
		};

		if(false)
		{
			var examples_menu = $("examples_menu");

			examples.forEach(function(example)
			{
				var file = example.split(",")[0],
					name = example.split(",")[1],

					menu = document.createElement("div");

				set_text(menu, name);

				menu.onclick = function()
				{
					
					http_get(rle_link(file), function(text)
					{
						setup_pattern(text, file);
						set_query(file);
						show_alert(current_pattern);
					});
				}

				examples_menu.appendChild(menu);
			});
		}
	}

    document.addEventListener("DOMContentLoaded", window.onload, false);


    function rle_link(id)
    {
        if(location.hostname === "localhost")
        {
            return pattern_path + id + ".rle";
        }
        else
        {
            return location.protocol + "//copy.sh/life/" + pattern_path + id + ".rle";
        }
    }

    function view_link(id)
    {
        return location.protocol + "//copy.sh/life/?pattern=" + id;
    }

    /**
     * @param {function()=} callback
     */
    function stop(callback)
    {
        if(running)
        {
            running = false;
            set_text($("run"), "Run");

            onstop = callback;
        }
        else
        {
            if(callback) {
                callback();
            }
        }
    }

    function reset_settings()
    {

        drawer.border_width = DEFAULT_BORDER;
        drawer.cell_width = 2;

        life.rule_b = 1 << 3;
        life.rule_s = 1 << 2 | 1 << 3;
        life.set_step(0);
        //set_text($("label_step"), "1");

        max_fps = DEFAULT_FPS;

        //set_text($("label_zoom"), "1:2");
        //fix_width($("label_mou"));

        drawer.center_view();
    }


    /**
     * @param {string=} pattern_source_url
     * @param {string=} view_url
     * @param {string=} title
     */
    function setup_pattern(pattern_text, pattern_id, pattern_source_url, view_url, title)
    {
        var result = formats.parse_pattern(pattern_text.trim());

        if(result.error)
        {
            set_text($("import_info"), result.error);
            return;
        }

        stop(function()
        {
            var bounds = life.get_bounds(result.field_x, result.field_y);

            if(title && !result.title)
            {
                result.title = title;
            }

            if(pattern_id && !result.title)
            {
                result.title = pattern_id;
            }

            life.clear_pattern();
            life.make_center(result.field_x, result.field_y, bounds);
            life.setup_field(result.field_x, result.field_y, bounds);

            life.save_rewind_state();

            if(result.rule_s && result.rule_b)
            {
                life.set_rules(result.rule_s, result.rule_b);
            }
            else
            {
                life.set_rules(1 << 2 | 1 << 3, 1 << 3);
            }

           

            fit_pattern();
            drawer.redraw(life.root,brain_pattern);

            //set_text($("pattern_name"), result.title || "no name");
            set_title(result.title);

            if(!pattern_source_url && pattern_id)
            {
                pattern_source_url = rle_link(pattern_id);
            }

            if(!view_url && pattern_id)
            {
                view_url = view_link(pattern_id);
            }

            current_pattern = {
                title : result.title,
                comment : result.comment,
                urls : result.urls,
                view_url : view_url,
                source_url: pattern_source_url,
            };
        });
    }

    function fit_pattern()
    {
        var bounds = life.get_root_bounds();

        drawer.fit_bounds(bounds);
    }

    /*
     * load a pattern consisting of otca metapixels
     */
    /*function load_otca(otca_on, otca_off, field)
    {
        var bounds = life.get_bounds(field);

        life.set_step(10);
        max_fps = 6;

        drawer.cell_width = 1 / 32;

        life.make_center(field, bounds);
        life.setup_meta(otca_on, otca_off, field, bounds);

        update_hud();
        drawer.redraw(life.root);
    }*/

    function run()
    {
        var n = 0,
            start,
            last_frame,
            frame_time = 1000 / max_fps,
            interval,
            per_frame = frame_time;

        set_text($("run"), "Stop");

        running = true;

        if(life.generation === 0)
        {
            life.save_rewind_state();
        }

        interval = setInterval(function()
        {
            update_hud(1000 / frame_time);
        }, 666);

        start = Date.now();
        last_frame = start - per_frame;

        function update()
        {
            if(!running)
            {
                clearInterval(interval);
                update_hud(1000 / frame_time);

                if(onstop) {
                    onstop();
                }
                return;
            }

            var time = Date.now();

            if(per_frame * n < (time - start))
            {
                life.next_generation(true);
                drawer.redraw(life.root,brain_pattern);

                n++;

                // readability ... my ass
                frame_time += (-last_frame - frame_time + (last_frame = time)) / 15;

                if(frame_time < .7 * per_frame)
                {
                    n = 1;
                    start = Date.now();
                }
            }

            nextFrame(update);
        }

        update();
    }

    function show_alert(pattern)
    {
        if(pattern.title || pattern.comment || pattern.urls.length)
        {
            show_overlay("alert");

            set_text($("pattern_title"), pattern.title || "");
            set_text($("pattern_description"), pattern.comment || "");

            $("pattern_urls").innerHTML = "";
            for(let url of pattern.urls)
            {
                let a = document.createElement("a");
                a.href = url;
                a.textContent = url;
                a.target = "_blank";
                $("pattern_urls").appendChild(a);
                $("pattern_urls").appendChild(document.createElement("br"));
            }

            if(pattern.view_url)
            {
                show_element($("pattern_link_container"));
                set_text($("pattern_link"), pattern.view_url);
                $("pattern_link").href = pattern.view_url;
            }
            else
            {
                hide_element($("pattern_link_container"));
            }

            if(pattern.source_url)
            {
                show_element($("pattern_file_container"));
                set_text($("pattern_file_link"), pattern.source_url);
                $("pattern_file_link").href = pattern.source_url;
            }
            else
            {
                hide_element($("pattern_file_container"));
            }
        }
    }

    function lazy_redraw(node,brain_pattern)
    {
        if(!running || max_fps < 15)
        {
            drawer.redraw(node,brain_pattern);
        }
    }

    function set_text(obj, text)
    {
        obj.textContent = String(text);
    }

    /**
     * fixes the width of an element to its current size
     */
    function fix_width(element)
    {
        element.style.padding = "0";
        element.style.width = "";

        if(!element.last_width || element.last_width < element.offsetWidth) {
            element.last_width = element.offsetWidth;
        }
        element.style.padding = "";

        element.style.width = element.last_width + "px";
    }


    function validate_color(color_str)
    {
        return /^#(?:[a-f0-9]{3}|[a-f0-9]{6})$/i.test(color_str) ? color_str : false;
    }

    /**
     * @param {function(string,number)=} onerror
     */
    function http_get(url, onready, onerror)
    {
        var http = new XMLHttpRequest();

        http.onreadystatechange = function()
        {
            if(http.readyState === 4)
            {
                if(http.status === 200)
                {
                    onready(http.responseText, url);
                }
                else
                {
                    if(onerror)
                    {
                        onerror(http.responseText, http.status);
                    }
                }
            }
        };

        http.open("get", url, true);
        http.send("");

        return {
            cancel : function()
            {
                http.abort();
            }
        };
    }

    function http_get_multiple(urls, ondone, onerror)
    {
        var count = urls.length,
            done = 0,
            error = false,
            handlers;

        handlers = urls.map(function(url)
        {
            return http_get(
                url.url,
                function(result)
                {
                    // a single request was successful

                    if(error) {
                        return;
                    }

                    if(url.onready) {
                        url.onready(result);
                    }

                    done++;

                    if(done === count) {
                        ondone();
                    }
                },
                function(result, status_code)
                {
                    // a single request has errored

                    if(!error)
                    {
                        error = true;

                        onerror();

                        for(var i = 0; i < handlers.length; i++)
                        {
                            handlers[i].cancel();
                        }
                    }
                }
            );
        });
    }

    /*
     * The mousemove event which allows moving around
     */
    function do_field_move(e)
    {
        var dx = e.clientX - last_mouse_x,
            dy = e.clientY - last_mouse_y;

        drawer.move(dx, dy);

        //lazy_redraw(life.root);

        last_mouse_x = e.clientX;
        last_mouse_y = e.clientY;
    }

    /*
     * The mousemove event which draw pixels
     */
    function do_field_draw(e)
    {
        var coords = drawer.pixel2cell(e.clientX, e.clientY);

        // don't draw the same pixel twice
        if(coords.x !== last_mouse_x || coords.y !== last_mouse_y)
        {
            life.set_bit(coords.x, coords.y, mouse_set);
            update_hud();

            drawer.draw_cell(coords.x, coords.y, mouse_set);
            last_mouse_x = coords.x;
            last_mouse_y = coords.y;
        }
    }

    function $(id)
    {
        return document.getElementById(id);
    }

    function set_query(filename)
    {
        if(!window.history.replaceState)
        {
            return;
        }

        if(filename)
        {
            window.history.replaceState(null, "", "?pattern=" + filename);
        }
        else
        {
            window.history.replaceState(null, "", "/life/");
        }
    }

    /** @param {string=} title */
    function set_title(title)
    {
        if(title)
        {
            document.title = title + " - " + initialTitle;
        }
        else
        {
            document.title = initialTitle;
        }
    }

    function hide_element(node)
    {
        node.style.display = "none";
    }

    function show_element(node)
    {
        node.style.display = "block";
    }

    function pad0(str, n)
    {
        while(str.length < n)
        {
            str = "0" + str;
        }

        return str;
    }

    // Put sep as a seperator into the thousands spaces of and Integer n
    // Doesn't handle numbers >= 10^21
    function format_thousands(n, sep)
    {
        if(n < 0)
        {
            return "-" + format_thousands(-n, sep);
        }

        if(isNaN(n) || !isFinite(n) || n >= 1e21)
        {
            return n + "";
        }

        function format(str)
        {
            if(str.length < 3)
            {
                return str;
            }
            else
            {
                return format(str.slice(0, -3)) + sep + str.slice(-3);
            }
        }

        return format(n + "");
    };


    function debounce(func, timeout)
    {
        var timeout_id;

        return function()
        {
            var me = this,
                args = arguments;

            clearTimeout(timeout_id);

            timeout_id = setTimeout(function()
            {
                func.apply(me, Array.prototype.slice.call(args));
            }, timeout);
        }
    }

	return this;
}

