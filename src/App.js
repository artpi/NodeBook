import React from 'react';
import './App.css';
import CytoscapeComponent from 'react-cytoscapejs';
import Cytoscape from 'cytoscape';
import COSEBilkent from 'cytoscape-cose-bilkent';
Cytoscape.use(COSEBilkent);

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { cytodata: [] };
  }
  componentDidMount() {
    console.log(window.ipcRenderer);
    window.ipcRenderer.on('terms', ( event, arg ) => {
      let notes = {};
      const terms = JSON.parse( arg );
      console.log( terms );
      Object.values( terms ).forEach( term => {
        if( term.references.length === 0 ) {
          return;
        }
        if( ! notes.hasOwnProperty( term.note.guid ) ) {
          notes[ term.note.guid ] = {
            data: {
              id: term.note.guid,
              label: term.note.title,
            }
          };
        }
        term.references.forEach( rnote => {
          if( ! notes.hasOwnProperty( rnote.guid ) ) {
            notes[ rnote.guid ] = {
              data: {
                id: rnote.guid,
                label: rnote.title,
              }
            };
          }
          const ref = rnote.guid + '_' + term.note.guid;
          notes[ ref ] = {
              data: {
                id: ref,
                source: rnote.guid,
                target: term.note.guid,
              }
            };
        } );
      } ); 
      console.log( Object.values( notes ) );
      Object.values( notes ).forEach( note => {
        this.cy.add( note );
      } ) 
      //this.setState( { cytodata: Object.values( notes ) } );
    })
  }
  render() {
    const style = [
            {
              selector: 'node',
              style: {
                shape: 'hexagon',
                'background-color': 'red',
                'label': 'data(label)',
                "text-wrap": "wrap",
                "text-max-width": 80,
              },
            }];
    const layout = {
          name:'circle',
          padding: 40,
          randomize: true,
          nodeRepulsion: 4500,
          idealEdgeLength: 100,
        }
    return (
      <div className="App" style={ { width:'1000px', height: '600px', padding: '5px'  } }>
      <CytoscapeComponent cy={(cy) => { this.cy = cy }} stylesheet={ style } elements={ [] } layout={ layout }  style={ { width: '990px', height: '590px' } } />
      </div>
    );
  }
}


