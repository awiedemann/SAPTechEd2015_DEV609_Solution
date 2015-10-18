sap.ui.controller("com.sap.teched.view.App", {

	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created.
	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
	 * @memberOf com.sap.teched.view.App
	 */
	//	onInit: function() {
	//
	//	},

	/**
	 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
	 * (NOT before the first rendering! onInit() is used for that one!).
	 * @memberOf com.sap.teched.view.App
	 */
	onBeforeRendering: function() {
		//Get regions which should be displayed in list
		this.getRegions();
		//Get geolocation and load google maps image to view
		this.getGeoLocation();
	},

	/**
	 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
	 * This hook is the same one that SAPUI5 controls get after being rendered.
	 * @memberOf com.sap.teched.view.App
	 */
	//	onAfterRendering: function() {
	//
	//	},

	/**
	 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
	 * @memberOf com.sap.teched.view.App
	 */
	//	onExit: function() {
	//
	//	}
	
	getRegions: function(){
		$.ajax({
            type: "GET",
            url: "regions.json",
            dataType: "json",
            success: function(data){
            	var oModel = new sap.ui.model.json.JSONModel(data);
            	sap.ui.getCore().setModel(oModel);
            }
        });
	},
	
	getGeoLocation: function() {
		//Create reference self to the original this
	var self = this;
        var options = {
            enableHighAccuracy: true,
            timeout: 100000,
            maximumAge: 0
        };
		
		//Success callback for current geolocation
        function success(pos) {
            var coordinates = pos.coords;

            var latitude = Math.round(coordinates.latitude * 1000000) / 1000000;
            var longitude = Math.round(coordinates.longitude * 1000000) / 1000000;
            var center = "center=" + latitude + "," + longitude;
            var marker = "markers=" + latitude + "," + longitude;
            self.getView().byId("geolocationImage").setSrc("https://maps.googleapis.com/maps/api/staticmap?" + center + "&" + marker + "&zoom=10&size=300x100&scale=2");
        }
		
		//Error callback for current geolocation
        function error(err) {
            sap.m.MessageToast.show("Geolocation could not be received. ERROR(" + err.code + "): " + err.message + ". Using SAP Headquarters Walldorf instead.");
        }

		//Get geolocation object if geolocation is available. Otherwise show Message Toast
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(success, error, options);
        }else{
            sap.m.MessageToast.show("Your browser doesn\'t support geolocation.");
        }
	},
	
	goToDetails: function(oEvent){
		//Get detail view and add current binding context
		var app = sap.ui.getCore().byId("idApp");
		var detailView = sap.ui.getCore().byId("idDetailView");
		var bindingContext = oEvent.getSource().getBindingContext();
		detailView.setBindingContext(bindingContext);
        app.to("idDetailView");
	}

});
