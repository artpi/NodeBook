const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const isDev = require('electron-is-dev');
var fs = require('fs');
const sqlite3 = require('sqlite3');

let mainWindow;


function loadNotes() {
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
   
  db.all(`SELECT N.ZGUID,N.ZTITLE, N.ZLOCALUUID, NB.ZNAME FROM ZENNOTE N JOIN ZENNOTEBOOK NB  where N.ZDATEDELETED < 0 AND N.ZNOTEBOOK = NB.Z_PK AND NB.ZNAME='@Marketing'  ORDER BY N.ZDATEUPDATED DESC;`, (err, rows) => {
    if (err) {
      console.error(err.message);
    }
    rows.forEach( function( row ) {
      const note = {
        'title' : row.ZTITLE,
        'guid' : row.ZGUID,
        'dir' : dbdir + '/content/' + row.ZLOCALUUID,
      }
      data.notes.push( note );
      if ( ! data.terms.hasOwnProperty( row.ZTITLE ) ) {
          data.terms[ row.ZTITLE ] = {
            'term': row.ZTITLE,
            'note' : note,
            'references' : [],
          };
      }
    } );

    Promise.all( data.notes.map( note => new Promise( (resolve, reject) => {
      fs.readFile( note.dir + '/content.enml', {encoding: 'utf-8'}, function(err,data){
          if ( !err ) {
              note.content = data.replace(/(<([^>]+)>)/ig," ");
              resolve( note );
          } else {
              reject( err );
          }
      });
    } ) ) ).then( dat => {
      console.log( dat );
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
  loadNotes();
  // mainWindow = new BrowserWindow({width: 900, height: 680});
  // mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`);
  // if (isDev) {
  //   // Open the DevTools.
  //   //BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
  //   mainWindow.webContents.openDevTools();
  // }
  // mainWindow.on('closed', () => mainWindow = null);
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
