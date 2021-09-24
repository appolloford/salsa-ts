import React from 'react';
import Plot from 'react-plotly.js';
import { FileInput } from '@blueprintjs/core';
import logo from './logo.svg';
import './App.css';

function App() {

  const readFile = (file: any) => {
    const reader = new FileReader()

    reader.onabort = () => console.log('file reading was aborted')
    reader.onerror = () => console.log('file reading has failed')
    reader.onload = () => {
      const binaryStr = reader.result
      console.log(binaryStr)
    }
    reader.readAsArrayBuffer(file)
  }

  return (
    <div className="App">
      {/* <FileInput multiple onChange={(files: any) => { console.log(files) } }/> */}
      {/* <FileInput 
        fill
        inputProps={{ multiple: true }}
        onInputChange={(files:any) => { alert('Selected files: ' + files.map((f:any) => f.name).join(', ')) }}
        // onInputChange={(files) => {console.log(files)}}
      /> */}
      {/* <FileInput inputProps={{ multiple: true, onChange: (e: any) => { console.log(e.target.files) } }} /> */}
      <FileInput inputProps={{ multiple: true, onChange: (e: any) => { readFile(e.target.files[0]) } }} />
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
              marker: { color: 'red' },
            },
            { type: 'bar', x: [1, 2, 3], y: [2, 5, 3] },
          ]}
          layout={{ width: 320, height: 240, title: 'A Fancy Plot' }}
        />
      </div>
    </div>
  );
}

export default App;
