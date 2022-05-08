
class Configurator {


	constructor(logger) {
		this.logger = logger;
		this.config = {};
		this.tempConfig = {};

		var that = this;

		if (localStorage.getItem("suitcase-config") !== null) {
			this.config = JSON.parse(window.localStorage.getItem("suitcase-config"));
		}


		$("body").append(`
			<div class="ui large modal" id="configuration-modal" style="border-radius: .28571429rem;">
				<i class="close icon" style="font-family: 'Icons'!important;"></i>
				<div class="header" style="border-bottom: 1px solid rgba(34,36,38,.15); border-radius: 0.285714rem;">Configuration
					<button class="circular ui icon button" style="float: right;" id="btn-config-download">
					  <i class="icon download"></i>
					</button>



<div class="ui icon big button" id="divUpload">
        <i class="cloud icon"></i>
        
 </div>
<input type="file" id="hidde-new-file" style="display: none">


					
<!--					<button class="circular ui icon button"  for="embedpollfileinput" style="float: right;" id="btn-config-upload">
					  <i class="icon upload"></i>
					         <input type="file" (change)="fileEvent($event)" class="inputfile" id="embedpollfileinput" />
					</button> 
-->

				</div>
				<div class="scrolling content">
					<div class="ui form" id="config-form"></div>
				</div>
				<div class="actions" style="border-top: 1px solid rgba(34,36,38,.15); border-radius: 0.285714rem;">
					<div class="ui negative button centered">Cancel</div>
					<div class="ui positive right labeled icon button" style="font-family: Roboto, Arial, sans-serif !important; background-color: #21ba45;" id="btn-config-ok">
						OK
						<i class="checkmark icon" style="top: -4px; background-color: rgba(0,0,0,.05);"></i>
					</div>
				</div>
			</div>

		`);



		

		$("#btn-config-ok").click(function(e) {
			that.saveConfig();

		});


		$("#btn-config-download").click(function() {
  			$('<a/>', {
    			"download": "sierrademo-config.json",
   				 "href" : "data:application/json," + encodeURIComponent(JSON.stringify(that.config)),
  			}).appendTo("body").click(function() {
     			$(this).remove();
			})[0].click();
  		});
/*  		$("#btn-config-upload").click(function() {
  			console.log("UUUUpload");
  			var reader = new FileReader();
          	reader.onload = function(event) {
          		var content = event.target.result;
          		console.log(content);
      		}
      		 reader.readAsText(archivo);
  		});
*/
 

		$.getJSON( "/js/static/command-window/config-schema.json", function( data ) {
			$.each( data.items, function( key, val ) {
				
				if(val.type === 'text' ) {

				//	var configuredValue = "";
					that.tempConfig[val.name] = {"name" : val.name, "value": ""};
					if(that.config.hasOwnProperty(val.name)){
						that.tempConfig[val.name].value = that.config[val.name].value;
					}

					$("#config-form").append(`
						<div class="field button" id="${val.name}-config-item">
							    <label>${val.caption}</label><input type="text" name="${val.name}-config-item" id="${val.name}-config-item-input" placeholder="${val.placeholder}"  data-content="${val.help}" value="${that.tempConfig[val.name].value}"/>
						</div>
					`);
					$(`#${val.name}-config-item`).on('focus',"input",function(e) { $(this).popup({ delay: { show: 100, hide: 800 }, position: 'bottom left'} ); });

					$(document).on("input", `#${val.name}-config-item-input`, function(e) {			
						var re = new RegExp(val.check, 'g');
						var inputToTest = $(`#${val.name}-config-item-input`).val();
						
						if(inputToTest.match(re)) {
							$(`#${val.name}-config-item`).removeClass("error");
							that.tempConfig[val.name].value =inputToTest;
							that.tempConfig[val.name].badConf = false;

							
							$("#btn-config-ok").removeClass("disabled");
							Object.keys(that.tempConfig).forEach(key => {
							    //console.log(key + ' - ' + myObj[key]) // key - value
							    if(! that.tempConfig[key].badConf) $("#btn-config-ok").addClass("disabled");
							});

							$("#btn-config-ok").removeClass("disabled");
						} else {
							$(`#${val.name}-config-item`).addClass("error");
							$("#btn-config-ok").addClass("disabled");
							that.tempConfig[val.name].badConf = true;
						} 
				

					});

				} else {
					console.error(`unsupported configuration item "${val.name}", "${val.type}"`);
				}

			});
			

		});

	}


	saveConfig() {
		this.config = this.tempConfig;
		window.localStorage.setItem("suitcase-config", JSON.stringify(this.config));

//		console.log("save Config:", this.tempConfig);
	}

	async open() {
		$('#configuration-modal').modal('show');
		//	ui fullscreen modal
	}

	/* get config() {
		return this.config;
	}
	*/
}
export { Configurator };
