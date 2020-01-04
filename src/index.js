import COSEBilkent from 'cytoscape-cose-bilkent';
const cytoscape = require( 'cytoscape' );


document.addEventListener( 'DOMContentLoaded', function() {
	const loadingContainer = document.getElementById( 'loading' );
	const cyContainer = document.getElementById( 'cy' );
	cytoscape.use( COSEBilkent );
	window.tooltipObject = document.getElementById( 'tooltip' );
	window.selectedNode = null;
	document.getElementById( 'selected_node_hide' ).addEventListener( 'click', function() {
		if ( window.selectedNode ) {
      window.selectedNode.data( 'hidden', true );
			window.selectedNode.hide();
		}
	} );
	window.ipcRenderer.on( 'cache', function( event, arg ) {
		console.log( 'CACHE LOAD ' + arg );
		loadingContainer.innerText = 'Received data from cache. Parsing';
		const elements = JSON.parse( arg );

		window.cy = cytoscape( {
			container: cyContainer,
			elements: elements,
			style: [
				{
					selector: 'node',
					style: {
						shape: 'ellipse',
						'background-color': 'data(color)',
						label: 'data(name)',
						'text-wrap': 'wrap',
						'text-max-width': 80,
					},
				},
			],
			layout: {
				name: 'preset',
			},
		} );
		window.cy.on( 'click', 'node', function( event ) {
			console.log( event );
			selectNode( event.target[ 0 ] );
			window.tooltipObject.style.left = event.renderedPosition.x - 50 + 'px';
			window.tooltipObject.style.top = event.renderedPosition.y - 100 + 'px';
		} );
		loadingContainer.style.display = 'none';
		cyContainer.style.display = 'block';
		//   window.layout = window.cy.layout();
		//   //this.setState( { cytodata: Object.values( notes ) } );
	} );

	window.ipcRenderer.on( 'menu_save', ( event, arg ) => {
		const elements = JSON.stringify( window.cy.elements().map( el => el.json() ) );
		console.log( 'saving', elements );
		window.ipcRenderer.send( 'save_action', elements );
	} );
	window.ipcRenderer.on( 'update', ( event, arg ) => {
		loadingContainer.innerText = arg;
	} );

	window.ipcRenderer.on( 'terms', ( event, arg ) => {
		loadingContainer.innerText = 'Received data from filesystem. Parsing';
		let notes = {};
		let nColors = {};
		const terms = JSON.parse( arg );
		console.log( terms );
		Object.values( terms ).forEach( term => {
			if ( term.references.length < 1 ) {
				return;
			}
			if ( ! nColors.hasOwnProperty( term.note.notebook ) ) {
				nColors[ term.note.notebook ] =
					'#' +
					Math.random()
						.toString( 16 )
						.substr( -6 );
			}
			notes[ term.note.guid ] = {
				group: 'nodes',
				data: {
					references: term.references.length,
					id: term.note.guid,
					name: term.note.title,
					notebook: term.note.notebook,
					snippet: term.note.snippet,
					color: nColors[ term.note.notebook ],
				},
			};
		} );
		Object.values( terms ).forEach( term => {
			term.references.forEach( rnote => {
				if ( ! notes.hasOwnProperty( rnote.guid ) ) {
					notes[ rnote.guid ] = {
						group: 'nodes',
						data: {
							references: 1,
							color: nColors[ rnote.notebook ],
							snippet: rnote.snippet,
							id: rnote.guid,
							name: rnote.title,
						},
					};
				}
				const ref = rnote.guid + '_' + term.note.guid;
				notes[ ref ] = {
					group: 'edges',
					data: {
						references: 0,
						id: ref,
						source: rnote.guid,
						target: term.note.guid,
					},
				};
			} );
		} );
		console.log( Object.values( notes ) );
		loadingContainer.innerText = 'Rendering the presentation...';
		window.cy = cytoscape( {
			container: cyContainer,
			elements: Object.values( notes ),
			style: [
				{
					selector: 'node',
					style: {
						shape: 'ellipse',
						'background-color': 'data(color)',
						label: 'data(name)',
						'text-wrap': 'wrap',
						'text-max-width': 80,
					},
				},{
					selector: 'node[data][references]',
					style: {
						'width': "mapData(references, 0, 4, 60, 200 )",
    					'height': "mapData(references, 0, 4, 60, 200 )",
					},
				}
				, {
				  "selector": "edge[target]",
				  "style": {
				    "target-arrow-shape": "arrow"
				  }
				}
			],
			layout: {
		        name: 'cose-bilkent',
	       //        idealEdgeLength: function (edge) {
		      //   // Default is: 10
		      //   // Instead, base it on "weight"
		      //   return edge.data().weight * .5
		      // },
		        // concentric: function( node ){
		        //   return node.data( 'references' );
		        // },
		        // levelWidth: function( nodes ){
		        //   return 3;
		        // },
		        animate: false,
			},
		} );
		loadingContainer.style.display = 'none';
		cyContainer.style.display = 'block';
		//   window.layout = window.cy.layout();
		//   //this.setState( { cytodata: Object.values( notes ) } );
		window.cy.on( 'click', 'node', function( event ) {
			console.log( event );
			selectNode( event.target[ 0 ] );
			window.tooltipObject.style.left = event.renderedPosition.x - 50 + 'px';
			window.tooltipObject.style.top = event.renderedPosition.y - 100 + 'px';
		} );
	} );

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
		window.tooltipObject.querySelector( '.title' ).innerText = node.json().data.name;
		window.tooltipObject.querySelector( '.snippet' ).innerText = node.json().data.snippet;
		document
			.getElementById( 'selected_node_open' )
			.setAttribute( 'href', `evernote:///view/1967834/s13/${ json.data.id }/${ json.data.id }/` );
	}
} );
