(function($, _, angular, undefined) {

var Sticklet = angular.module("Sticklet");

Sticklet
    .controller("MenuCtrl", ["$scope", function($scope) {
        
    }])
    .controller("NotesCtrl", ["$scope", "HTTP", function($scope, HTTP) {
        $scope.display = "tiled";
        $scope.sortBy = "updated";
        $scope.notes = [];
        HTTP.get("/notes").then(function(notes) {
            $scope.notes = notes;
        });
    }])
    .controller("NoteCtrl", ["$scope", function($scope) {
        console.log("noteID", $scope.noteID);
    }]);
}(jQuery, _, angular));