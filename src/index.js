const cytoscape = require( 'cytoscape' );
const coseBilkent = require('cytoscape-cose-bilkent');

document.addEventListener('DOMContentLoaded', function() {
      const loadingContainer = document.getElementById( 'loading' );
      const cyContainer = document.getElementById('cy')
      cytoscape.use( coseBilkent );

      let selectedNode = null;
      document.getElementById('selected_node_hide').addEventListener( 'click', function() {
        if( selectedNode ) {
          selectedNode.hide();
        }
      } );

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
                color: nColors[ term.note.notebook ],
              }
            };
          }
          term.references.forEach( rnote => {
            if( ! notes.hasOwnProperty( rnote.guid ) ) {
              notes[ rnote.guid ] = {
                data: {
                  color: nColors[ rnote.notebook ],
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
                  shape: 'hexagon',
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
    });

function selectNode( node ) {
  selectedNode = node;
  const json = node.json();
  console.log( node.json() );
  const el = document.getElementById( 'selectednote' );
  el.innerHTML = '<h4>' + node.json().data.name + '</h4>';
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
                  shape: 'hexagon',
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
          selectNode( event.target[0] );
        });
        loadingContainer.style.display = 'none';
        cyContainer.style.display = 'block';
      //   window.layout = window.cy.layout();
      //   //this.setState( { cytodata: Object.values( notes ) } );
    });




              });