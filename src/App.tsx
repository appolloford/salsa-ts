import React from 'react';
import Plot from 'react-plotly.js';
import { FileInput } from '@blueprintjs/core';
import logo from './logo.svg';
import './App.css';

function App() {

  // const { text, buttonText } = {"Choose File...", "Uplaod"}
  const text = "Choose File..."
  const buttonText = "Upload"

  return (
    <div className="App">
      <FileInput />
      {/* <input type="file" id="actual-btn" hidden/> */}
      {/* <form>
        <input type="file" id="myFile" name="filename" />
        <input type="submit" />
      </form> */}
      <div>
        <Plot
          data={[
            {
              x: [1, 2, 3],
              y: [2, 6, 3],
              type: 'scatter',
              mode: 'lines+markers',
              marker: {color: 'red'},
            },
            {type: 'bar', x: [1, 2, 3], y: [2, 5, 3]},
          ]}
          layout={ {width: 320, height: 240, title: 'A Fancy Plot'} }
        />
      </div>
    </div>
  );
}

export default App;
