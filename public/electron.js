const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const dialog = electron.dialog;

const path = require('path');
const isDev = require('electron-is-dev');
var fs = require('fs');
const sqlite3 = require('sqlite3');
const { ipcMain } = require('electron');
const glob = require('glob');

let mainWindow;


function loadFromCache( mainWindow, file ) {
      fs.readFile( file, {encoding: 'utf-8'}, function( err,data ){
          if ( !err ) {
              mainWindow.webContents.send( 'cache', data );
          } else {
              console.log( err );
          }
      });
}

function loadNotes( mainWindow, localNoteStore ) {
  mainWindow.webContents.send( 'update', "Reading your notes. Please wait." );
  const dbdir = localNoteStore.replace( '/localNoteStore/LocalNoteStore.sqlite', '' );

  const notebooks = [ 'Zeszycik', '@Business', 'HotContent', 'Commonplace', 'Ref', 'Zrobic', 'Chcę', 'Earn', 'Grateful', 'Inwestycje', 'Kopki', 'Marysia', 'Podróże', 'Rodzina', 'TED', 'Zdrowie & Sport' ];
  const inStatement = '(' + notebooks.map( n => "'" + n + "'" ).join( ',') + ')';

  const data = {
    'notes': [],
    'terms': {},
  };

  let db = new sqlite3.Database( localNoteStore, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the chinook database.');
  });
   //AND NB.ZNAME IN ${inStatement}
  db.all(`SELECT N.ZGUID,N.ZTITLE, N.ZLOCALUUID, NB.ZNAME FROM ZENNOTE N JOIN ZENNOTEBOOK NB  where N.ZDATEDELETED < 0 AND N.ZNOTEBOOK = NB.Z_PK  ORDER BY N.ZDATEUPDATED DESC;`, (err, rows) => {
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
              let content = notecontent.replace(/(<([^>]+)>)/ig," ");
              content = content.replace(/\s\s+/g, ' ');
              note.snippet = content.substr( 0, 100 );

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
              resolve();
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
  let saveDir = "";
  const menu = Menu.buildFromTemplate( [
    {
      label: 'File',
      submenu: [
        {
          label:'Save Data',
          click() {
            saveDir = dialog.showSaveDialogSync( mainWindow, {
              buttonLabel: 'Save current state here',
            } );
            if( saveDir ) {
              console.log( 'save to ' + saveDir );
              mainWindow.webContents.send( 'menu_save' );
            }
          }
        },
        {
          label:'Open Saved State',
          click() {
            const file = dialog.showOpenDialogSync({ properties: ['openFile'], buttonLabel: 'Open this saved session' });
            if ( file ) {
              loadFromCache( mainWindow, file[0] );
            }
          }
        },
        {
          label:'Load from Evernote',
          click() {
            const startPath = app.getPath('home') + '/Library/Group Containers/';
            const globPath = startPath + '*.com.evernote.Evernote/CoreNote/accounts/www.evernote.com/*/localNoteStore/LocalNoteStore.sqlite'
            glob( globPath, {}, function ( er, files ) {
              if( files ) {
                loadNotes( mainWindow, files[0] );
                return;
              }
              const file = dialog.showOpenDialogSync( {
                defaultPath: startPath,
                title: 'You are searching for "localNoteStore/LocalNoteStore.sqlite" somewhere in a dir with evernote name on it.',
                properties: ['openFile'],
                filters: [
                  { name: 'Evernote Database', extensions: [ 'sqlite' ] }
                ],
                buttonLabel: 'Open this database'
              });
              if ( file ) {
                loadNotes( mainWindow, file[0] );
              }
            } );            
          }
        },
      ]
    }
  ] );
  Menu.setApplicationMenu( menu );
  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
  if (isDev) {
    // Open the DevTools.
    //BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
    // mainWindow.webContents.openDevTools();
  }
  mainWindow.webContents.on('did-finish-load', () => {
    console.log( "Did finishi load fired!" );
    // loadFromCache( mainWindow );
    // loadNotes( mainWindow );
  });
  ipcMain.on('save_action', ( event, data ) => {
    console.log( 'Saving' );
    console.log( data );
    fs.writeFile( saveDir ,data, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file was saved!");
}); 

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
