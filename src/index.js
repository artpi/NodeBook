const cytoscape = require( 'cytoscape' );
const coseBilkent = require('cytoscape-cose-bilkent');

document.addEventListener('DOMContentLoaded', function() {
      const loadingContainer = document.getElementById( 'loading' );
      const cyContainer = document.getElementById('cy')
      cytoscape.use( coseBilkent );

      window.tooltipObject = document.getElementById('tooltip');
      window.selectedNode = null;
      document.getElementById('selected_node_hide').addEventListener( 'click', function() {
        if( window.selectedNode ) {
          window.selectedNode.remove();
        }
      } );
      // document.getElementById('save_action').addEventListener( 'click', function() {
      //   const elements = JSON.stringify( window.cy.elements().map( el => el.json() ) );
      //   console.log( 'sending', elements )
      //   window.ipcRenderer.send( 'save_action', elements );
      // } );

      window.ipcRenderer.on('terms', ( event, arg ) => {
        loadingContainer.innerText = "Received data from filesystem. Parsing";
        let notes = {};
        let nColors = {};
        const terms = JSON.parse( arg );
        console.log( terms );
        Object.values( terms ).forEach( term => {
          if( term.references.length === 0 ) {
            return;
          }
          if( ! nColors.hasOwnProperty( term.note.notebook ) ) {
            nColors[ term.note.notebook ] = '#'+Math.random().toString(16).substr(-6);
          }
          if( ! notes.hasOwnProperty( term.note.guid ) ) {
            notes[ term.note.guid ] = {
              data: {
                id: term.note.guid,
                name: term.note.title,
                notebook: term.note.notebook,
                snippet: term.note.snippet,
                color: nColors[ term.note.notebook ],
              }
            };
          }
          term.references.forEach( rnote => {
            if( ! notes.hasOwnProperty( rnote.guid ) ) {
              notes[ rnote.guid ] = {
                data: {
                  color: nColors[ rnote.notebook ],
                  snippet: term.note.snippet,
                  id: rnote.guid,
                  name: rnote.title,
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

        window.cy = cytoscape({
          container: cyContainer,
          elements: Object.values( notes ),
          style: [
              {
                selector: 'node',
                style: {
                  'shape': 'ellipse',
                  'background-color': 'data(color)',
                  'label': 'data(name)',
                  "text-wrap": "wrap",
                  "text-max-width": 80,
                },
              }],
              layout: {
            'name':'cose-bilkent',
            'nodeDimensionsIncludeLabels': true,
            randomize: true,
            // Node repulsion (non overlapping) multiplier
            nodeRepulsion: 450000,
            dealEdgeLength: 500,
          }
        });
        loadingContainer.style.display = 'none';
        cyContainer.style.display = 'block';
      //   window.layout = window.cy.layout();
      //   //this.setState( { cytodata: Object.values( notes ) } );
        window.cy.on('click', 'node', function(event) {
          console.log(event);
          selectNode( event.target[0] );
          window.tooltipObject.style.left= ( event.renderedPosition.x - 50 ) + 'px';
          window.tooltipObject.style.top= ( event.renderedPosition.y - 100 ) + 'px';
        });
    });

function selectNode( node ) {
  if ( window.selectedNode ) {
    window.selectedNode.style( 'shape', 'ellipse' );
  }
  node.style( 'shape', 'star' );
  node.style( 'background-color', 'blue' );
  node.connectedEdges().forEach( function( edge ) {
    console.log( edge.select() );
  } );

  window.selectedNode = node;
  const json = node.json();
  console.log( node.json() );
  window.tooltipObject.querySelector('.title').innerText = node.json().data.name;
  window.tooltipObject.querySelector('.snippet').innerText = node.json().data.snippet;
  document.getElementById('selected_node_open').setAttribute("href", `evernote:///view/1967834/s13/${json.data.id}/${json.data.id}/`);
}

      window.ipcRenderer.on('cache', ( event, arg ) => {
        loadingContainer.innerText = "Received data from cache. Parsing";
        const elements = JSON.parse( arg );

        window.cy = cytoscape({
          container: cyContainer,
          elements: elements,
          style: [
              {
                selector: 'node',
                style: {
                  'shape': 'ellipse',
                  'background-color': 'data(color)',
                  'label': 'data(name)',
                  "text-wrap": "wrap",
                  "text-max-width": 80,
                },
              }],
              layout: {
            'name':'preset',
          }
        });
        window.cy.on('click', 'node', function(event) {
          console.log(event);
          selectNode( event.target[0] );
          window.tooltipObject.style.left= ( event.renderedPosition.x - 50 ) + 'px';
          window.tooltipObject.style.top= ( event.renderedPosition.y - 100 ) + 'px';
        });
        loadingContainer.style.display = 'none';
        cyContainer.style.display = 'block';
      //   window.layout = window.cy.layout();
      //   //this.setState( { cytodata: Object.values( notes ) } );
    });




              });