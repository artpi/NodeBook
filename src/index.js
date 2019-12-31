const cytoscape = require( 'cytoscape' );
const coseBilkent = require('cytoscape-cose-bilkent');

document.addEventListener('DOMContentLoaded', function() {
      cytoscape.use( coseBilkent );



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
              name: term.note.title,
            }
          };
        }
        term.references.forEach( rnote => {
          if( ! notes.hasOwnProperty( rnote.guid ) ) {
            notes[ rnote.guid ] = {
              data: {
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
        container: document.getElementById('cy'),
        elements: Object.values( notes ),
        style: [
            {
              selector: 'node',
              style: {
                shape: 'hexagon',
                'background-color': 'red',
                'label': 'data(name)',
                "text-wrap": "wrap",
                "text-max-width": 80,
              },
            }],
            layout: {
          'name':'cose-bilkent',
        }
      });

    //   window.layout = window.cy.layout();
    //   //this.setState( { cytodata: Object.values( notes ) } );
    });



              });