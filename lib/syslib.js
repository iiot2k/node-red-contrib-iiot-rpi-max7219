/**
 * Copyright 2022 Ocean (iiot2k@gmail.com).
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use node file except in compliance with the License.
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

const fs = require('fs');

module.exports.outError = function (node, errShort, errLong) {
	if (node.save_txt === errShort)
		return true;

	node.save_txt = errShort;
	node.status({ fill: "red", shape: "ring", text: errShort });
	node.error(errLong);

	return true;
}

module.exports.outOk = function (node) {
	if (node.save_txt === "-OK-")
		return;

	node.save_txt = "-OK-";
	node.status({ fill: "green", shape: "ring"});
}

function getRpiTarget()
{
	if (process.platform !== 'linux')
		return undefined;
	
	var cpuinfo = fs.readFileSync("/proc/cpuinfo").toString();

	if (cpuinfo.indexOf(": BCM") === -1)
		return undefined;
	
	if (process.arch === "arm64")
		return "_s64.node";
	else if (process.arch === "arm")
		return "_s32.node";
	
	return undefined;
}

module.exports.LoadModule = function (module) {
	try {
		var modName = getRpiTarget();
		if (modName !== undefined)
			return require("./" + module + modName);
	}
	catch (e) { console.log(e); }
	return undefined;
}
