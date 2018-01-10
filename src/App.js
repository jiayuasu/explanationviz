import React, { Component } from 'react';
//import logo from './logo.svg';
import DataMap from './datamap.js';
import './App.css';
import {AttributeSelector} from "./dataselector";
import GraphListView from './mainmenu/graphs';
import {json as requestJson} from 'd3-request';

const STATE_SELECTION = 1;
const STATE_POLYGAMY = 2;
const STATE_AGGRAVATION = 3;
const STATE_INTERVENTION = 4;


class Evaluation extends Component {
    render(){
        return <DataMap/>;
    }
}

class Container extends Component {
    constructor(props){
        super(props);
        this.state = {
            statsData: []
        }
    }

    componentDidMount(){
        requestJson('data/taxistats.json',
            (err, data) => {
                if(err){
                   console.log(err);
                }else{
                    this.setState({
                        statsData: data
                    });
                }

            }
        );
    }

    render(){
        return (
            <div className="container">
                <GraphListView data={this.state.statsData} />
            </div>
        );
    }
}


class App extends Component {
    render() {
        return (
            <div className="App">
                <Container />
            </div>
        );
    }
}


export default App;
