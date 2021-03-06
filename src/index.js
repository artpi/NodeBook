import COSEBilkent from 'cytoscape-cose-bilkent';
const cytoscape = require( 'cytoscape' );

function hideNode( node ) {
	// If node has only 1 connection, hide it.
	console.log( 'hidind', node.id );
	node.connectedEdges().forEach( edge => edge.connectedNodes().forEach( connectedNode => {
		console.log( 'node', connectedNode.id(), connectedNode.connectedEdges().length );
		if ( connectedNode.id() !== node.id() && connectedNode.connectedEdges().length < 2 ) {
			// connectedNode.data( 'hidden', true );
			connectedNode.remove();
		}
	} ) );
	// node.data( 'hidden', true );
	node.remove();
}

document.addEventListener( 'DOMContentLoaded', function() {
	const cyContainer = document.getElementById( 'cy' );
	cytoscape.use( COSEBilkent );
	window.tooltipObject = document.getElementById( 'tooltip' );
	window.selectedNode = null;
	document.getElementById( 'selected_node_hide' ).addEventListener( 'click', function() {
		if ( window.selectedNode ) {
			hideNode( window.selectedNode );
		}
	} );

	window.ipcRenderer.on( 'notebook_hide', function hideNotebook( event, notebook ) {
		window.cy.elements().forEach( function( el ) {
			if( el.data( 'notebook' ) === notebook ) {
				hideNode( el );
			}
		} );
	} );


	function runCytoscape( elements, layout ) {
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
						width: 'mapData(references, 0, 40, 20, 80)',
    					height: 'mapData(references, 0, 40, 20, 80)',
					},
				}
				, {
				  "selector": "edge[target]",
				  "style": {
				    "target-arrow-shape": "arrow"
				  }
				}
			],
			layout: layout,
		} );
		window.cy.on( 'click', 'node', function( event ) {
			selectNode( event.target[ 0 ] );
			window.tooltipObject.style.left = event.renderedPosition.x - 50 + 'px';
			window.tooltipObject.style.top = event.renderedPosition.y - 100 + 'px';
		} );

		document.getElementById( 'intro' ).style.display = 'none';
		document.getElementById( 'loading' ).style.display = 'none';
		cyContainer.style.display = 'block';
	}

	// This is ran when we get data from previously saved file loaded in.
	window.ipcRenderer.on( 'cache', function( event, arg ) {
		console.log( 'CACHE LOAD ' + arg );
		document.getElementById( 'loading' ).style.display = 'block';
		document.getElementById( 'intro' ).style.display = 'none';
		const elements = JSON.parse( arg );
		runCytoscape( elements, {
				name: 'preset',
		} );
	} );

	window.ipcRenderer.on( 'menu_save', ( event, arg ) => {
		const elements = JSON.stringify( window.cy.elements().map( el => el.json() ) );
		console.log( 'saving', elements );
		window.ipcRenderer.send( 'save_action', elements );
	} );
	window.ipcRenderer.on( 'update', ( event, arg ) => {
		document.getElementById( 'loading' ).style.display = 'block';
		document.querySelector( '#loading .intro p' ).innerText = arg;
		document.getElementById( 'intro' ).style.display = 'none';
	} );

	window.ipcRenderer.on( 'terms', ( event, arg ) => {
		document.querySelector( '#loading .intro p' ).innerText = 'Received data from the system. Parsing';
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
							notebook: rnote.notebook,
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

		document.querySelector( '#loading .intro p' ).innerText = 'Rendering the presentation...';
		runCytoscape( Object.values( notes ), {
		        name: 'cose-bilkent',
		        nodeRepulsion: 1000000,
		        edgeElasticity: 0.0001,
		        gravity: 0.0001,
		        fit: true,
		        // animate: false,
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
