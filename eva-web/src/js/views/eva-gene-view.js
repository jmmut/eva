/*
 * Copyright (c) 2014 Francisco Salavert (SGL-CIPF)
 * Copyright (c) 2014 Alejandro Alemán (SGL-CIPF)
 * Copyright (c) 2014 Ignacio Medina (EBI-EMBL)
 * Copyright (c) 2014 Jag Kandasamy (EBI-EMBL)
 *
 * This file is part of EVA.
 *
 * EVA is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EVA is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EVA. If not, see <http://www.gnu.org/licenses/>.
 */
var variant = {};
var geneID = '';

function EvaGeneView(args) {
    _.extend(this, Backbone.Events);
    this.id = Utils.genId("EVAGeneView");
    _.extend(this, args);
    this.rendered = false;
    this.render();


}
EvaGeneView.prototype = {
    render: function () {
        var _this = this

        this.targetDiv = (this.target instanceof HTMLElement) ? this.target : document.querySelector('#' + this.target);
        if (!this.targetDiv) {
            console.log('EVAv-GeneView: target ' + this.target + ' not found');
            return;
        }

        this.targetDiv.innerHTML = _this._varinatViewlayout();
        geneID = this.geneId;
        console.log(this.geneId)

        alert(geneID)
        var geneData;

        CellBaseManager.get({
            species: 'hsapiens',
            category: 'feature',
            subCategory: 'gene',
            query: geneID.toUpperCase(),
            resource: "info",
            async: false,
            params: {
//                include: 'chromosome,start,end'
            },
            success: function (data) {
                console.log(data)
                for (var i = 0; i < data.response.length; i++) {
                    var queryResult = data.response[i];
                    console.log(queryResult)
                    if(!_.isEmpty(queryResult.result[0])){
                        geneData = queryResult.result[0];
                    }
                }
            }
        });

        _this.draw(geneData);

        $('#geneViewTabs li').click(function(event) {
            $(this).toggleClass("active");
            $(this).siblings().removeClass("active");
        });
        $( document ).ready(function() {
            $('body').scrollspy({ 'target': '#geneViewScrollspy', 'offset': 250 });
        });
    },
    draw: function (data) {
            var _this = this;
//                     var variantInfoTitle =  document.querySelector("#variantInfo").textContent = variantID+' Info';
            var geneViewDiv = document.querySelector("#geneView");
            $(geneViewDiv).addClass('show-div');
            var summaryContent =  _this._renderSummaryData(data);
            var summaryEl = document.querySelector("#summary-grid");
            var summaryElDiv =  document.createElement("div");
            //       summaryElDiv.innerHTML = '<h4>Summary</h4>';
            summaryElDiv.innerHTML = summaryContent;
            summaryEl.appendChild(summaryElDiv);




            var transcriptEl = document.querySelector("#transcripts-grid");
            var transcriptElDiv = document.createElement("div");
            transcriptElDiv.setAttribute('class', 'eva variant-widget-panel ocb-variant-stats-panel');
            //       transcriptElDiv.innerHTML = '<h4>Studies</h4>';
            transcriptEl.appendChild(transcriptElDiv);
            _this.createTranscriptsPanel(transcriptElDiv,data);

            var gvEl = document.querySelector("#genome-viewer-grid");
            var gvElDiv = document.createElement("div");
            gvElDiv.setAttribute('class', 'ocb-gv');
            gvEl.appendChild(gvElDiv);
            var genomeViewer = _this._createGenomeViewer(gvElDiv);
            genomeViewer.draw();


    },
    _renderSummaryData: function (data) {
            var source = '<a href="http://www.ensembl.org/Homo_sapiens/Gene/Summary?g='+data.id+'" target="_blank">'+data.source+':'+data.id+'</a>'
            var _summaryTable  = '<div class="row"><div class="col-md-8"><table class="table ocb-stats-table">'
            _summaryTable +='<tr><td class="header">Gene Type</td><td>'+data.biotype+'</td></tr>' +
                '<tr><td class="header">Location</td><td>'+data.chromosome+':'+data.start+'-'+data.end+'</td></tr>' +
                '<tr><td class="header">Description</td><td>'+data.description+'</td></tr>' +
                '<tr><td class="header">Source</td><td>'+source+'</td></tr>' +
                '</table>'

            _summaryTable += '</div></div>'

            return _summaryTable;

    },
    createTranscriptsPanel: function (target,data) {
        var _this = this;
        var variantTranscriptGrid = new EvaVariantTranscriptGrid({
            target: target
        });

        variantTranscriptGrid.load(data);
        variantTranscriptGrid.draw();


        return variantTranscriptGrid;
    },
    _createGenomeViewer: function (target) {
//        var _this = this;

        var View =  Ext.create('Ext.view.View', {
            tpl: new Ext.XTemplate('<div id="gene-view-gv"></div>'),
            margin: '5 10 10 10'
        });
        this.headerConfig = {
            baseCls: 'eva-header-1'
        };

        var panel = Ext.create('Ext.panel.Panel', {
            layout: {
                type: 'vbox',
                align: 'stretch'
            },
            autoHeight: true,
            overflowY: true,
            height: 900,
            header: this.headerConfig,
            collapsible:true,
//            padding: 10,
            renderTo:target,
            items: [View]
        });
        var View =  Ext.create('Ext.view.View', {
            tpl: new Ext.XTemplate('<div id="gene-view-gv"></div>'),
            margin: '5 10 10 10'
        });

        var region = new Region({
            chromosome: "13",
            start: 32889611,
            end: 32889611
        });

        var genomeViewer = new GenomeViewer({
            cellBaseHost:'https://wwwdev.ebi.ac.uk/cellbase/webservices/rest',
            sidePanel: false,
            target: 'gene-view-gv',
            border: false,
            resizable: true,
            width: 1200,
            region: region,
            trackListTitle: '',
            drawNavigationBar: true,
            drawKaryotypePanel: true,
            drawChromosomePanel: true,
            drawRegionOverviewPanel: true,
            overviewZoomMultiplier: 50,
            navigationBarConfig: {
                componentsConfig: {
                    restoreDefaultRegionButton: false,
                    regionHistoryButton: false,
                    speciesButton: false,
                    chromosomesButton: false,
                    karyotypeButtonLabel: false,
                    chromosomeButtonLabel: false,
                    //regionButton: false,
//                    zoomControl: false,
                    windowSizeControl: false,
//                    positionControl: false,
//                    moveControl: false,
//                    autoheightButton: false,
//                    compactButton: false,
//                    searchControl: false
                }
            }
        });
        console.log(genomeViewer)
        genomeViewer.setZoom(80);

        var renderer = new FeatureRenderer(FEATURE_TYPES.gene);
        renderer.on({
            'feature:click': function (event) {
                // feature click event example
                console.log(event)
            }
        });
        var geneOverview = new FeatureTrack({
//        title: 'Gene overview',
            minHistogramRegionSize: 20000000,
            maxLabelRegionSize: 10000000,
            height: 100,

            renderer: renderer,

            dataAdapter: new CellBaseAdapter({
                category: "genomic",
                subCategory: "region",
                resource: "gene",
                params: {
                    exclude: 'transcripts,chunkIds'
                },
                species: genomeViewer.species,
                cacheConfig: {
                    chunkSize: 100000
                }
            })
        });


        var sequence = new SequenceTrack({
//        title: 'Sequence',
            height: 30,
            visibleRegionSize: 200,

            renderer: new SequenceRenderer(),

            dataAdapter: new SequenceAdapter({
                category: "genomic",
                subCategory: "region",
                resource: "sequence",
                species: genomeViewer.species
            })
        });


        var gene = new GeneTrack({
            title: 'Gene',
            minHistogramRegionSize: 20000000,
            maxLabelRegionSize: 10000000,
            minTranscriptRegionSize: 200000,
            height: 60,

            renderer: new GeneRenderer(),

            dataAdapter: new CellBaseAdapter({
                category: "genomic",
                subCategory: "region",
                resource: "gene",
                species: genomeViewer.species,
                params: {
                    exclude: 'transcripts.tfbs,transcripts.xrefs,transcripts.exons.sequence'
                },
                cacheConfig: {
                    chunkSize: 100000
                }
            })
        });

        var snp = new FeatureTrack({
            title: 'SNP',
            featureType: 'SNP',
            minHistogramRegionSize: 10000,
            maxLabelRegionSize: 3000,
            height: 100,

            renderer: new FeatureRenderer(FEATURE_TYPES.snp),

            dataAdapter: new CellBaseAdapter({
                category: "genomic",
                subCategory: "region",
                resource: "snp",
                params: {
                    exclude: 'transcriptVariations,xrefs,samples'
                },
                species: genomeViewer.species,
                cacheConfig: {
                    chunkSize: 10000
                }
            })
        });

        genomeViewer.addOverviewTrack(geneOverview);
        genomeViewer.addTrack([sequence, gene, snp]);

        return genomeViewer;
    },

    _varinatViewlayout:function(){

        var layout = '<div id="gene-view">'+
                        '<div class="row">'+
                            '<div  class="col-sm-1  col-md-1 col-lg-1"></div>'+
                            '<div  class="col-sm-11 col-md-11 col-lg-11"> <h2 id="variantInfo"></h2></div>'+
                        '</div>'+
                        '<div class="row">'+
                            '<div class="col-sm-1  col-md-1 col-lg-1" id="geneViewScrollspy">'+
                                '<ul id="geneViewTabs" class="nav nav-stacked affix eva-tabs">'+
                                    '<li class="active"><a href="#summary">Summary</a></li>'+
                                    '<li><a href="#transcripts">Transcripts</a></li>'+
                                    '<li><a href="#genomeViewer">GV</a></li>'+
//                                    '<li><a href="#genomeViewer">Genomic Co</a></li>'+
                               '</ul>'+
                            '</div>'+
                            '<div id="scroll-able" class="col-sm-11 col-md-11 col-lg-11">'+
                                '<div id="summary" class="row">'+
                                    '<div class="col-md-10" style="margin-left:10px;">'+
                                        '<h4 class="gene-view-h4"> Summary</h4>'+
                                        '<div id="summary-grid"></div>'+
                                    '</div>'+
                                '</div>'+
                                '<div  id="transcripts" class="row">'+
                                    '<div class="col-md-12" style="margin-left:10px;">'+
                                        '<h4 class="gene-view-h4"> Transcripts </h4>'+
                                        '<div id="transcripts-grid"></div>'+
                                    '</div>'+
                                '</div>'+
                                '<br /><div  id="genomeViewer" class="row">'+
                                    '<div class="col-md-12" style="margin-left:10px;">'+
                                        '<h4 class="gene-view-h4"> Genome Viewer </h4>'+
                                        '<div id="genome-viewer-grid"></div>'+
                                    '</div>'+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>'
        return layout;
    }

}


