/**
 * Copyright 2022 Ocean (iiot2k@gmail.com).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

"use strict";

module.exports = function(RED) {
	const syslib = require("./lib/syslib.js");
	const sysmodule = syslib.LoadModule("rpi_max7219");

    RED.nodes.registerType("max7219-7seg", function(n) {
		var node = this;
		RED.nodes.createNode(node, n);

		node.spich = parseInt(n.spich);
		node.nmod = n.nmod;
		node.npos = n.npos;
		node.intens = n.intens;
		node.ralign = n.ralign;
		node.fill = n.fill;
		node.iserror = false;
		node.status({});

		node.name = this.name || "7seg-led " + node.spich + "#" + node.npos + "/" + node.nmod;

		if (sysmodule === undefined)
			node.iserror = syslib.outError(node, "driver error", "driver not load, wrong os or not Raspi");
		else if (node.npos >= n.nmod)
			node.iserror = syslib.outError(node, "inv position", "invalid postion or pos >= number module");
		else if (!sysmodule.init(node.spich, node.nmod, node.intens))
			node.iserror = syslib.outError(node, "open error", "spi port not open, check spi settings");

		node.on("input", function (msg) {
			if (node.iserror)
				return;
			
			if (msg.hasOwnProperty('clear'))
				sysmodule.clear(node.spich);

			if (msg.hasOwnProperty('intens')) {
				if ((typeof msg.intens == 'number') && 
					(msg.intens >= 0) && 
					(msg.intens <= 15) && 
					(msg.intens != node.intens)) {
					sysmodule.intensity(node.spich, msg.intens);
					node.intens = msg.intens;
				}
				return;
			}

			var npos = node.npos;

			if (msg.hasOwnProperty('npos')) {
				if ((typeof msg.npos == 'number') &&  (msg.npos < node.nmod))
					npos = msg.npos;
				else {
					syslib.outError(node, "inv position", "invalid postion or pos >= number module");
					return;
				}
			}

			// Load custom font
			if (msg.hasOwnProperty('customfont')) {
				var topos = 0;
				if (msg.hasOwnProperty('topos')) {
					if ((typeof msg.topos == 'number') &&  (msg.topos >= 0x00) && (msg.topos <= 0x1F))
						topos = msg.topos;
				}

				if (!Array.isArray(msg.customfont)) {
					syslib.outError(node, "inv font", "invalid custom font array");
					return;
				}
				
				for(var i=0; i < msg.customfont.length; i++) {
					if (typeof msg.customfont[i] !== "number") {
						syslib.outError(node, "font number", "invalid custom font number");
						return;
					}
	
					if (msg.customfont[i] < 0)
						msg.customfont[i] = 0;
					else if (msg.customfont[i] > 255)
						msg.customfont[i] = 255;
				}

				if (!sysmodule.write7segCustomFont(msg.customfont, topos)) {
					syslib.outError(node, "font error", "custom Font not load");
					return;
				}
				else
					syslib.outOk(node);
			}

			var ralign = node.ralign;

			if (msg.hasOwnProperty('ralign')) {
				if (typeof msg.ralign == 'boolean')
					ralign = msg.ralign;
			}

			var fill = node.fill;

			if (msg.hasOwnProperty('fill')) {
				if ((typeof msg.fill == 'string') && (msg.fill.length > 0))
					fill = msg.fill;
			}

			var out_txt = String(msg.payload);
			if (typeof  out_txt !== "string") {
				syslib.outError(node, "not string", "msg.payload not string");
				return;
			}

			if (out_txt.length == 0)
				return;

			if (!sysmodule.write7seg(node.spich, npos, ralign, fill, out_txt))
				syslib.outError(node, "write error", "device not write, check spi and device");
			else
				syslib.outOk(node);
		});

		node.on('close', function () {
			sysmodule.clear(node.spich);
		});
	});
}
