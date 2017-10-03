import MapGL from 'react-map-gl';
import Map from './map.js';
import React from 'react';
import HistogramView from './histogramview.js';
import {DataSelector, AttributeSelector} from './dataselector.js'
import Loading from './loading.js';
import {json as requestJson} from 'd3-request';
import _ from 'lodash';
import DeckGLOverlay from './deckgloverlay.js';
import CartoSidepanel from './cartogram_sidepanel.js';

class DataMap extends Map {
    constructor(props){
        super(props);
        this.MODE_DATASET_SELECT = 1;
        this.MODE_ATTRIBUTE_SELECT = 2;
        this.MODE_HISTOGRAM_VIEW = 3;
        this.MODE_HEATMAP_VIEW = 4;
        this.state.mode = this.MODE_DATASET_SELECT;
        this.state.loading = true;
        this.state.datasets = [];
        this.state.datasetid=null;
        this.state.data=null;
        this.state.hoverObject=null;
        this.state.nonspatialattribute=null;
        this.state.spatialattribute=null;

    }

    componentDidMount(){
        super.componentDidMount();
        this.getDataSets();
        this.setState({
            loading: false
        });
    }

    getDataSets(){
        // Show Loading
        this.setState({
            loading: true
        });

        requestJson('http://localhost:8080/datasets.json', (err, resp)=>{
            if(err){
                console.log(err);
            }else{
                this.setState({
                    datasets: resp
                });
            }
            this.setState({
                loading: false
            });
        });
    }

    loadDataSet(datasetid){
        console.log("Loading dataset "+datasetid);

        // Show Loading
        this.setState({
            loading: true,
            datasetid: datasetid
        });

        let nonspatialattributes = [];
        let spatialattributes =[];

        let result = _.find(this.state.datasets, (dataset)=>{return dataset.id===datasetid;});
        if(result){
            nonspatialattributes = result.nonspatial;
            spatialattributes = result.spatial;
        }else{
            console.log('No matching dataset found');
        }

        // Change Mode
        this.setState({
            mode: this.MODE_ATTRIBUTE_SELECT,
            nonSpatialAttrs: nonspatialattributes,
            spatialAttrs: spatialattributes,
            datasetid: datasetid
        });


        this.setState({
            loading: false
        });
    }


    loadHeatmap(nonspatialatt, spatialatt){
        console.log("Loading Heatmap for "+nonspatialatt+"/"+spatialatt);

        let dataset = _.find(this.state.datasets,{id: this.state.datasetid});
        let attributename=null;
        let spatialattributename=null;
        if(dataset) {
            let attribute = _.find(dataset.nonspatial, {id: nonspatialatt});
            if(attribute){
                attributename = attribute.name;
            }

            attribute = _.find(dataset.nonspatial, {id: spatialatt});
            if(attribute){
                spatialattributename = attribute.name;
            }
        }

        //Show Loading
        this.setState({
            loading: true,
            mode: this.MODE_HEATMAP_VIEW,
            nonspatialattribute: attributename,
            spatialattribute: spatialattributename
        });


        // TODO Load Heatmap data
        requestJson(`http://localhost:8080/cartogram.json?datasetid=${this.state.datasetid}&spatialid=${spatialatt}&attributeid=${nonspatialatt}`,
            (err, resp)=>{
                if(err){
                    console.log(err);
                }else{
                    this.setState({
                        data: resp
                    });
                }
                this.setState({
                    loading: false
                });

            }

        );

    }

    changeHoverObject(object){
        if(object){
            document.body.style.cursor='pointer';
        }
        this.setState({
            hoverObject: object
        });
    }

    render(){
        const {viewport, mode, loading, datasets, datasetid, data} = this.state;

        let additionalViews = [];
        let outerViews = [];
        let additionalViewKey = 0;
        let outerViewKey=0;


        if(mode===this.MODE_DATASET_SELECT){
            additionalViews.push(
                <DataSelector key={++additionalViewKey}
                              datasets={datasets}
                              onDataSelect={this.loadDataSet.bind(this)}

                />
            );
        }

        if(mode===this.MODE_ATTRIBUTE_SELECT){
            additionalViews.push(
                <AttributeSelector key={++additionalViewKey}
                                   nonspatialattributes={this.state.nonSpatialAttrs}
                                   spatialattributes={this.state.spatialAttrs}
                                   onAttributeSet={this.loadHeatmap.bind(this)}
                />
            );
            outerViews.push(
                <HistogramView key={++outerViewKey}
                               datasetid={datasetid}
                />
            );
        }

        if(mode===this.MODE_HEATMAP_VIEW){
            additionalViews.push(
                  <CartoSidepanel key={++additionalViewKey}
                        object={this.state.hoverObject}
                        attribute={this.state.nonspatialattribute}
                  />
            );
        }

        if(loading){
            outerViews.push(<Loading key={++outerViewKey} />);
        }


        return (
            <div className="mdl-layout mdl-js-layout mdl-layout--fixed-drawer">
                <div className="mdl-layout__drawer">
                    <span className="mdl-layout-title" style={{padding: 0}}>GeoSpatial Viz</span>
                    <nav className="mdl-navigation">
                        {/* Options */}
                        {additionalViews}
                    </nav>
                </div>
                <main className="mdl-layout__content">

                    <div className="page-content">
                        <MapGL
                            {...viewport}
                            mapStyle="mapbox://styles/anique/cj887jlt131vu2srt4ve78bdj"
                            dragrotate={true}
                            onViewportChange={this._onChangeViewport.bind(this)}
                            mapboxApiAccessToken={this.MAPBOX_TOKEN} >
                            <DeckGLOverlay className='deckoverlay' viewport={viewport}
                                           strokeWidth={3}
                                           data={data}
                                           onHoverPolygon={this.changeHoverObject.bind(this)}
                            />
                        </MapGL>
                        {outerViews}
                    </div>
                </main>
            </div>

        );
    }
}

export default DataMap;