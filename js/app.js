var app = angular.module('MyTutorialApp',[]);

app.controller("MainController", function($scope,$http, $location, $routeParams, $log ){
	$scope.solrQuery = '*';
	$scope.solrUrl = '';
	$scope.currentSolrUrl = '';
	$scope.selectedCore = '';
	$scope.solrRows = 10;
	$scope.solrStart = 0;
	$scope.solrCluster = [];
	$scope.indexConfiguration = [];	
	
	$scope.firstPage = function() {
		$scope.solrStart = 0;
		$scope.search();
	}

	$scope.lastPage = function() {
		if($scope.solr === undefined) {
			$scope.search();
			return;
		}
		$scope.solrStart = $scope.solr.response.numFound - ($scope.solr.response.numFound % $scope.solrRows );
		$scope.search();
	}

	$scope.nextPage = function() {
		$scope.solrStart = $scope.solrStart + $scope.solrRows;
		$scope.search();
	}

	$scope.previousPage = function() {
		$scope.solrStart = $scope.solrStart - $scope.solrRows ;
		if($scope.solrStart < 0) {
			$scope.solrStart = 0;
		}
		$scope.search();
	}

	$scope.searchQuery = function() {
		$scope.solrStart = 0;
		$scope.search();
	}

	$scope.search = function() {
		if($scope.selectedCore.name === undefined) {
			return;
		}

		coreName = $scope.selectedCore.name
		url = $scope.selectedSolrCluster.url + '/' + $scope.selectedCore.name + '/select?q=' + $scope.solrQuery;
		
		if($scope.indexConfiguration.facetConfiguration[coreName] !== undefined) {
			url = url + '&facet.limit=' + $scope.indexConfiguration.facetConfiguration[coreName].facetLimit + '&facet=true'
			for(var i in $scope.indexConfiguration.facetConfiguration[coreName].facetFields) {
				url = url + '&facet.field=' + $scope.indexConfiguration.facetConfiguration[coreName].facetFields[i];
			};
		}

		url = url + '&start=' + $scope.solrStart;
		url = url + '&rows=' + $scope.solrRows;

		$scope.currentSolrUrl= url;
		$scope.solrUrl = url;
		$scope.searchByUrl(url);
	};
	$scope.clusterChanged = function() {
		$scope.getAllCores();
		url = $scope.selectedSolrCluster.url + '/' + $scope.selectedCore.name + '/select?q=' + $scope.solrQuery;
		$scope.currentSolrUrl= url;
		$scope.solrUrl = url;

		$scope.searchByUrl(url);

	};
	$scope.searchWithSolrUrl = function() {
		$scope.solrUrl = $scope.solrUrl.replace(/(\r\n|\n|\r)/gm,"");
		$scope.solrUrl = $scope.solrUrl.replace(/ /g,'');
		$scope.searchByUrl($scope.solrUrl);
	};

	$scope.searchByUrl = function(solrUrl) {
		$scope.currentSolrUrl = solrUrl;
        $http.jsonp(solrUrl + '&wt=json&json.nl=arrarr&json.wrf=JSON_CALLBACK').
	    success(function(data, status, headers, config) {
	    	var currentMapping = $scope.indexConfiguration.fieldMapping[$scope.selectedCore.name];
	    	if(typeof currentMapping === "undefined" ) {
	    		currentMapping = {"title":"title","description":"description","url":"url","thumb":"thumb"};
	    	}
	    	data.response.mappedDocs = [];
	    	for (var i in data.response.docs) {
	    		var mapped = [];
	    		
	    		mapped['title'] = $scope.guessField(data.response.docs[i], [currentMapping.title, "title", "name", "keyword", "id"]);
	    		mapped['description'] = $scope.guessField(data.response.docs[i], [currentMapping.description, "description", "teaser", "desc","content"]);
	    		mapped['url'] = $scope.guessField(data.response.docs[i], [currentMapping.url, "url", "url_s","landingpage","link"]);
	    		mapped['thumb'] = $scope.guessField(data.response.docs[i], [currentMapping.thumb, "thumb", "thumbnail", "thumbnailurl", "thumbnail_url", "thumburl","logo","imageurl","cover","image"]);
	    		if(typeof mapped['thumb'] === "undefined") {
	    			mapped['thumb'] = 'img/image-not-found.jpg';
	    		}
	    		data.response.mappedDocs.push(mapped);
			}

	      $scope.solr  = data;
	  }).
	    error(function(data, status, headers, config) {
	      $scope.solr = '';
	      // or server returns response with an error status.
	    });
    }

    $scope.guessField = function(doc, fieldList) {
    	for (var i in fieldList) {
    		value = doc[fieldList[i]]
    		if(typeof value !== "undefined")  {
    			return value;
    		}
    	}

    	for (var field in doc) {
    		for (var i in fieldList) {
    			if(field.toLowerCase().indexOf(fieldList[i].toLowerCase()) > -1){
    				return doc[field];
    			}
    		}
    	}
    }

    $scope.getAllCores = function() {
		solrUrl = $scope.selectedSolrCluster.url + '/admin/cores?indexInfo=false';
        $http.jsonp(solrUrl + '&wt=json&json.nl=arrarr&json.wrf=JSON_CALLBACK').
	    success(function(data, status, headers, config) {
	      $scope.solrCores  = data;
	      for (var a in $scope.solrCores.status) {
	      	$scope.selectedCore =  $scope.solrCores.status[a];
	      	break;
	      }
	      //$scope.search();
	      
	  }).
	    error(function(data, status, headers, config) {
	    	$scope.solrCores = '';
	    	$scope.selectedCore = '';
	      	
	    });
    }

    $scope.readConfig = function() {
        $http.get('config/cluster-config.js').
	    success(function(data, status, headers, config) {
	      $scope.solrCluster  = data;
	      $scope.selectedSolrCluster = $scope.solrCluster[0];
	  	}).
	    	error(function(data, status, headers, config) {
	    		alert('could not read cluster config')	
	    });
	    $http.get('config/index-config.js').
	    success(function(data, status, headers, config) {
	      $scope.indexConfiguration  = data;
	  	}).
	    	error(function(data, status, headers, config) {
	    		alert('could not read index config')	
	    });
    }

    $scope.init = function() {
    	$scope.readConfig();
    	//$scope.getAllCores();
    }

    
    $scope.init();
    //$scope.getAllCores();
   	//$scope.clusterChanged();
	//$scope.search();
});

