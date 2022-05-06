'use strict';

import { Logger } from '/js/static/command-window/Logger.js';


class Indicator {


	static neutral = "neutral";
	static ok = "ok";
	static error = "error";
	static tentative = "tentative";
	static stateList = [Indicator.neutral,Indicator.ok,Indicator.error,Indicator.tentative];

	constructor(indicators,element) {
		this.indicators = {};
		var that = this;
		if(!Array.isArray(indicators)) throw "Indicator must be initialized with array of indicators";
		if(!element) throw "Indicator must be initialized with an element where to append indicator fields";

		var content = '<table class="indicator"><tbody>';
		indicators.forEach(function(elem) {
			content += `<td id="indicator-${elem.name}" class="indicator-${elem.status}">${elem.caption}</td>`;
			that.indicators[elem.name] = {'name': elem.name ,'status': elem.status, 'caption': elem.caption };
		});
		content += '</tbody></table>'
		$('#'+element).append(content);
		
	}

	setState(indicator, state) {
		if(! Indicator.stateList.includes(state)) throw `setting invalid state "${state}" to indicator "${indicator}" must be one of "neutral", "ok", "error", "tentative" consider to use e.g. "Indicator.ok"`;
		var currentState = this.indicators[indicator].status;
		this.indicators[indicator].status = state;
		
		if(state !== currentState) {
			$('#indicator-' + indicator).addClass('indicator-' + state).removeClass('indicator-' + currentState);
		}

	}

	getState(indicator) {
		return this.indicators[indicator].status;
	}

	

}
export { Indicator };
