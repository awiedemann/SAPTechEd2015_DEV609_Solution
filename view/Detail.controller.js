sap.ui.controller("com.sap.teched.view.Detail", {

	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created.
	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
	 * @memberOf com.sap.teched.view.Detail
	 */
	//	onInit: function() {
	//
	//	},

	/**
	 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
	 * (NOT before the first rendering! onInit() is used for that one!).
	 * @memberOf com.sap.teched.view.Detail
	 */
	//	onBeforeRendering: function() {

	//	},

	/**
	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
	 * This hook is the same one that SAPUI5 controls get after being rendered.
	 * @memberOf com.sap.teched.view.Detail
	 */
	//	onAfterRendering: function() {
	//
	//	},

	/**
	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
	 * @memberOf com.sap.teched.view.Detail
	 */
	//	onExit: function() {
	//
	//	}
	
	goBack: function(){
		var app = sap.ui.getCore().byId("idApp");
		app.back();
	},
	
	/*global device*/
	
	onCheckIn: function(){
		var bindingContext = sap.ui.getCore().byId("idDetailView").getBindingContext();
		if(bindingContext.getProperty("reachable") === "Success"){
			var event = {
	            "eventType": "CHECKIN",
	            "deviceUUID": device.uuid,
	            "timestamp": Date.now(),
	            "region": bindingContext.getProperty("_links/self/href")
	        };
	        
	        //Send checkin event to server
	        $.ajax({
	            type: "POST",
	            url: "https://dev609ac8d8ce9a.hana.ondemand.com/resources/events",
	            data: JSON.stringify(event),
	            contentType: "application/json; charset=utf-8",
	            dataType: "json",
	            success: function(){
	            	sap.m.MessageToast.show("Check in to " + bindingContext.getProperty("identifier") + " successful");
	            }
	        });
        }else{
        	sap.m.MessageToast.show("Check in is currently not possible as " + bindingContext.getProperty("identifier") + " is not in reach.");
        }
	}

});