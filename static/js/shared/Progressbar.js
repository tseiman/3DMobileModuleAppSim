class Progressbar {
	constructor(element) {
		console.log("new progree");
		this.element = $(element);
		this.elementName = element.replace(/#/g, '');

		$(this.element).append(`
			<style type="text/css">
				#${this.elementName}-progressbar-wrap {
					width: 100%;
    				height: 100%;
					background-color: rgba(255,255,255,0.2);
				}
				#${this.elementName}-progressbar {
					width: 0%;
					height: 100%;
					background-color: #fff;
					width: 0%;
				}
			</style>
			<div id="${this.elementName}-progressbar-wrap">
				  <div id="${this.elementName}-progressbar"></div>
			</div>
		`);
		this.progressbarelement = $(`#${this.elementName}-progressbar`);
		this.progressbarelementwrap = $(`#${this.elementName}-progressbar-wrap`);
	}

	set(percent) {
		$(this.progressbarelement).width(`${percent}%`);
	}


	destroy() {
		$(this.progressbarelementwrap).remove();
	}
}

export { Progressbar };