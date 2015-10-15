sap.ui.controller("com.sap.teched.view.App", {
	
	/*global estimote device*/

	/**
	 * Called when a controller is instantiated and its View controls (if available) are already created.
	 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
	 * @memberOf com.sap.teched.view.App
	 */
	onInit: function() {
		//Create reference self to the original this
		self = this;
		
		//On iOS 8 your app should ask for permission to use location services (required for monitoring and ranging on iOS 8 - on Android and iOS 7 this function does nothing)
        estimote.beacons.requestAlwaysAuthorization();
	},

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
		//Get region data from backend
		$.ajax({
            type: "GET",
            url: "https://dev609ac8d8ce9a.hana.ondemand.com/resources/regions",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(data){
        		//Adapt model to remote data
            	var oModel = new sap.ui.model.json.JSONModel(data._embedded);
            	sap.ui.getCore().setModel(oModel);
            	//Start monitoring and ranging for regions
                self.startMonitoring(data._embedded.regions);
            	//Hide pull to refresh once data is received
            	sap.ui.getCore().byId("idAppView--pullToRefresh").hide();
            }
        });
	},
	
	getGeoLocation: function() {
        var options = {
            enableHighAccuracy: true,
            timeout: 100000,
            maximumAge: 0
        };
		
		//Success callback for current geolocation
        function success(pos) {
            var crd = pos.coords;

            var latitude = Math.round(crd.latitude * 1000000) / 1000000;
            var longitude = Math.round(crd.longitude * 1000000) / 1000000;
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
	},
	
	handleRefresh: function(){
		this.stopMonitoring();
		this.getRegions();
		this.getGeoLocation();
	},
	
	startMonitoring: function(regions){
        for(var i = 0; i < regions.length; i++){
            var region = regions[i];
            //Start monitoring for beacons in region
            estimote.beacons.startMonitoringForRegion(region, this.onBeaconMonitored, this.onMonitoringError);
        }
    },

    stopMonitoring: function(){
        var regions = sap.ui.getCore().getModel().getData();
        for(var i = 0; i < regions.length; i++){
            var region = regions[i];
            //Stop monitoring for beacons in region
            estimote.beacons.stopMonitoringForRegion(region, null, null);
            //Stop ranging for beacons in region
            estimote.beacons.stopRangingBeaconsInRegion(region, null, null);
        }
    },

	onBeaconMonitored: function(beaconInfo){
        if(beaconInfo.state === "inside" || beaconInfo.state === "outside"){
            for(var x = 0; x < sap.ui.getCore().getModel().getProperty("/regions").length; x++){
                if(sap.ui.getCore().getModel().getProperty("/regions/" + x + "/major") === beaconInfo.major){
                    if(beaconInfo.state === "inside" && sap.ui.getCore().getModel().getProperty("/regions/" + x + "/reachable") === "None"){
                        sap.m.MessageToast.show("You reached the location " + sap.ui.getCore().getModel().getProperty("/regions/" + x + "/identifier"));
                        sap.ui.getCore().getModel().setProperty("/regions/" + x + "/reachable", "Success");
                        sap.ui.getCore().getModel().setProperty("/regions/" + x + "/distance", "In Reach");

                        var event = {
                            "eventType": "MONITORING",
                            "deviceUUID": device.uuid,
                            "timestamp": Date.now(),
                            "region": sap.ui.getCore().getModel().getProperty("/regions/" + x + "/_links/self/href")
                        };

                        //Send monitoring event to server
                        $.ajax({
                            type: "POST",
                            url: "https://dev609ac8d8ce9a.hana.ondemand.com/resources/events",
                            data: JSON.stringify(event),
                            contentType: "application/json; charset=utf-8",
                            dataType: "json"
                        });

                    }else if(beaconInfo.state === "outside" && sap.ui.getCore().getModel().getProperty("/regions/" + x + "/reachable") === "Success"){
                        sap.m.MessageToast.show("You left the location " + sap.ui.getCore().getModel().getProperty("/regions/" + x + "/identifier"));
                        sap.ui.getCore().getModel().setProperty("/regions/" + x + "/reachable", "None");
                        sap.ui.getCore().getModel().setProperty("/regions/" + x + "/distance", "Not in Reach");
                    }
                }
            }
        }
	},

	onMonitoringError: function(error) {
        sap.m.MessageToast.show("Start monitoring error: " + error);
	}

});