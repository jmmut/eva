angular.module('beaconModule', []).directive('beaconWidget', function () {
    return {
        restrict: 'E',
        replace: true,
        transclude: true,
        template: '<div>' +
                    '<h2>A Web Interface for Genomic Variant Queries - EBI</h2>'+

                    '<div class="row">' +
                    '<div class="col-md-10 div-secondary">' +
                    '<div ng-show="resultShow">' +
                        '<div ng-show="textType">'+
                        '<table>'+
                            '<tr><td>Chromosome: {{selectedChr}}</td></tr>'+
                            '<tr><td>Coordinate: {{coordinate}} </td></tr>'+
                            '<tr><td>Allele:     {{allele}}</td></tr>'+
                            '<tr><td>Exists: {{variantResult}}</td></tr>'+
                        '</table>'+
                        '</div>'+
                        '<div ng-show="jsonType">{{variantResult}}</div>'+
                    '</div>'+
                    '</div>'+
                    '</div>'+

                    '<div   ng-show="formShow"><form id="beacon" ng-submit="beaconSubmit()">'+
                    '<div class="row">'+
                    '<div class="col-md-2 form-group"><p>Chromosome</p></div>'+
                    '<div class="col-md-2 form-group input-group-sm"><select ng-model="selectedChr" ng-options="obj.value as obj.label for obj in chromosomes"></select></div>'+
                    '</div>'+
                    '<div class="row">'+
                    '<div class="col-md-2 form-group"><p>Coordinate</p></div>'+
                    '<div class="col-md-2 form-group input-group-sm"><input class="form-control" id="name" ng-model=coordinate  type="text" required/></div>'+
                    '</div>'+
                    '<div class="row">'+
                    '<div class="col-md-2 form-group"><p>Allele</p></div>'+
                    '<div class="col-md-2 form-group input-group-sm"><input class="form-control" id="name" ng-model=allele  type="text" required/></div>'+
                    '</div>'+
                    '<h4>Format Type</h4>'+
                    '<div class="row">'+
                    '<div class="col-md-2 form-group"><p>Text</p></div>'+
                    '<div class="col-md-4 form-group input-group-sm"> <input type="radio" ng-model="formatType" value="text"> </div>'+
                    '</div>'+
                    '<div class="row">'+
                    '<div class="col-md-2 form-group"><p>JSON</p></div>'+
                    '<div class="col-md-4 form-group input-group-sm"> <input type="radio" ng-model="formatType" value="json"> </div>'+
                    '</div>'+
                    '<div class="row">'+
                    '<div class="col-md-4 form-group"><button class="btn btn-primary" type="submit">Submit</button></div>'+
                    '</div>'+
                    '</form>'+
                    '<div class="row">' +
                    '<div class="col-md-12"><b>Example queries:</b>'+
                    '<table>'+
                    '<tr>'+
                        '<td>Chrom:13<br />Coordinate:32888799<br />Allele:G<br />Project:PRJEB6040<br /></td>'+
                        '<td>Chrom:13<br />Coordinate:32888799<br />Allele:C </td>'+
                        '<td>Chrom:1<br />Coordinate:46403<br />Allele:TGT<br />Project:PRJEB4019</td>'+
                        '<td>Chrom:1<br />Coordinate:46403<br />Allele:INS<br />Project:PRJEB4019</td>'+
                        '<td> Chrom:1<br />Coordinate:1002921<br />Allele:DEL<br />Project:PRJEB4019 </td>'+
                    '</tr>'+
                    '</table>'+
                    '</div>'+
                    '</div>'+
                    '</div>'+
                  '</div>',
        link: function($scope, element, attr) {
            jQuery('#topMenuTab a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
                if(e.target.parentElement.id == 'beaconLi'){
                    $('#topMenuTab a').hide();
                }
            });

        },
        controller: function($scope) {


            var chrArray= new Array();
            var i=1;
            for (i = 1; i < 25; i++) {
                if(i == 23){
                    chrArray.push({value:i,label:'Chr X'})
                }
                else if(i == 24){
                    chrArray.push({value:i,label:'Chr Y'})
                }else{
                    chrArray.push({value:i,label:'Chr '+i})
                }

            }

            $scope.variantResult = '';
            $scope.formShow = true;
            $scope.resultShow = false;

            $scope.chromosomes= chrArray;
            $scope.selectedChr = 1;

            $scope.beaconSubmit = function(){

                var region = $scope.selectedChr+':'+$scope.coordinate+':'+ $scope.allele;

                var variantExist;
                evaManager.get({
                    category: 'variants',
                    resource: 'exists',
                    params: {
                        of: 'json'
                    },
                    query:region ,
                    async: false,
                    success: function (data) {
                        variantExist = data.response.result[0];
                    },
                    error: function (data) {
                        console.log('Could not get variant exists');
                    }
                });


                $scope.resultShow = true;
                if($scope.formatType == "text"){
                   var result = variantExist;
                   $scope.textType = true;
                }else{
                    var result = {chromosome:$scope.selectedChr,coordinate:$scope.coordinate,allele:$scope.allele,exists:variantExist}
                    $scope.jsonType = true;

                }

                $scope.variantResult = result;
                $scope.formShow = false;

                console.log( $scope.selectedChr)
                console.log( $scope.formatType)
                console.log( $scope.coordinate)
                console.log( $scope.allele)
                console.log(  $scope.variantResult)
            }

        }
    }
})