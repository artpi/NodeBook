import React from 'react';
import logo from './logo.svg';
import './App.css';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { data: '' };
  }
  componentDidMount() {
    console.log(window.ipcRenderer);
    window.ipcRenderer.on('terms', ( event, arg ) => {
      this.setState( { data: arg } );
    })
    window.ipcRenderer.send('ping')
  }
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            { this.state.data }
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}


