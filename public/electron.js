const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const isDev = require('electron-is-dev');
var fs = require('fs');
const sqlite3 = require('sqlite3');
const { ipcMain } = require('electron');

let mainWindow;


function loadFromCache( mainWindow ) {
      fs.readFile( '/Users/artpi/Desktop/nodes_cache.json', {encoding: 'utf-8'}, function(err,data){
          if ( !err ) {
              mainWindow.webContents.send( 'cache', data );
          } else {
              console.log( err );
          }
      });
}

function loadNotes( mainWindow ) {

  const notebooks = [ '@Business', 'HotContent', 'Commonplace', 'Ref', 'Zrobic', 'Chcę', 'Earn', 'Grateful', 'Inwestycje', 'Kopki', 'Marysia', 'Podróże', 'Rodzina', 'TED', 'Zdrowie & Sport' ];
  const inStatement = '(' + notebooks.map( n => "'" + n + "'" ).join( ',') + ')';

  const data = {
    'notes': [],
    'terms': {},
  };
  var dbdir =  '/Users/artpi/Library/Group Containers/Q79WDW8YH9.com.evernote.Evernote/CoreNote/accounts/www.evernote.com/1967834';
  let db = new sqlite3.Database(dbdir + '/localNoteStore/LocalNoteStore.sqlite', sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the chinook database.');
  });
   
  db.all(`SELECT N.ZGUID,N.ZTITLE, N.ZLOCALUUID, NB.ZNAME FROM ZENNOTE N JOIN ZENNOTEBOOK NB  where N.ZDATEDELETED < 0 AND N.ZNOTEBOOK = NB.Z_PK AND NB.ZNAME IN ${inStatement}  ORDER BY N.ZDATEUPDATED DESC;`, (err, rows) => {
    if (err) {
      console.error(err.message);
    }
    rows.forEach( function( row ) {
      const note = {
        'title' : row.ZTITLE,
        'guid' : row.ZGUID,
        'notebook': row.ZNAME,
        'dir' : dbdir + '/content/' + row.ZLOCALUUID,
      }
      data.notes.push( note );
      if ( ! data.terms.hasOwnProperty( row.ZTITLE ) ) {
          data.terms[ row.ZTITLE ] = {
            'term': row.ZTITLE,
            'note' : note,
            'references' : [],
            'regexp': new RegExp( '[^0-9a-zA-Z]' + row.ZTITLE.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '[^0-9a-zA-Z]', "i" ),
          };
      }
    } );

    Promise.all( data.notes.map( note => new Promise( (resolve, reject) => {
      fs.readFile( note.dir + '/content.enml', {encoding: 'utf-8'}, function(err,notecontent){
          if ( !err ) {
              const content = notecontent.replace(/(<([^>]+)>)/ig," ");
              
              Object.values( data.terms ).forEach( term => {
                if( term.term.length < 5 ) {
                  return;
                }
                if ( term.note.guid === note.guid ) {
                  return
                }
                if( content.search( term.regexp ) !== -1 ) {
                  term.references.push( note );
                }
              } );
              resolve( note );
          } else {
              reject( err );
          }
      });
    } ) ) ).then( dat => {
      mainWindow.webContents.send( 'terms', JSON.stringify( data.terms ) );
    } );
    
    
  });
   
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Close the database connection.');
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: true,
      preload: __dirname + '/preload.js'
    }
  });
  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
  if (isDev) {
    // Open the DevTools.
    //BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
    // mainWindow.webContents.openDevTools();
  }
  mainWindow.webContents.on('did-finish-load', () => {
    console.log( "Did finishi load fired!" );
    loadFromCache( mainWindow );
  });
  
  mainWindow.on('closed', () => mainWindow = null);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
