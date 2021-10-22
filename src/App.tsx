import { useState, useEffect, useRef } from 'react';
import { FileInput, HTMLSelect, Slider } from '@blueprintjs/core';
import Viewer from './components/Viewer';
import readerDef from './python/fitsreader.py';
import './App.css';

declare global { // <- [reference](https://stackoverflow.com/a/56458070/11542903)
  interface Window {
    pyodide: any;
    jsarray: any;
    loadPyodide: any;
    // languagePluginLoader: any;
  }
}

const pyodideInstance = async () => {
  const pyodide = await window.loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/"
  });
  await pyodide.loadPackage("astropy")
  // await pyodide.loadPackage("astropy")
  return pyodide
}

const runScript = async (pyodide: any, code: string) => {
  await pyodide.runPythonAsync(code)
  const content = pyodide.globals.get("fitsreader")
  console.log("globals", content)

  return content
}

function App() {
  const pyodideObj = useRef<any>(null);
  const [loadPyodideOK, setLoadPyodideOK] = useState(false);
  const [newFileName, setNewfileName] = useState("");
  const [unit, setUnit] = useState("freq");
  const [xPrecision, setXPrecision] = useState(6);
  useEffect(() => {
    async function init() {
      if (!loadPyodideOK) {
        pyodideObj.current = await pyodideInstance();
        setLoadPyodideOK(true)
      } else {
        console.log("no duplicate reload to avoid pyodide error")
      }
    }
    init()
  });

  const [dataSource, setDataSource] = useState();

  const getData = async (file: File) => {
    const script = await (await fetch(readerDef)).text();
    // console.log("script text", scriptText)
    const content = await runScript(pyodideObj.current, script);
    // console.log("content", content)
    // console.log("header", content.header.toJs())
    // const xdata = content.axisdata(1).toJs()
    // const ydata = content.rawdata.toJs()[0][0]

    setNewfileName(file.name);
    setDataSource(content);
  }

  const readFile = (file: File) => {
    if (file) {
      console.log("processing file:", file)
      const reader = new FileReader()

      reader.onabort = () => console.log('file reading was aborted')
      reader.onerror = () => console.log('file reading has failed')
      reader.onload = () => {
        // Do whatever you want with the file contents
        window.jsarray = new Float32Array(reader.result as ArrayBuffer);
        getData(file);
      }
      reader.readAsArrayBuffer(file)
    }
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
      <Viewer fileName={newFileName} dataSource={dataSource} unit={unit} xPrecision={xPrecision} />
      <div>
        x-axis unit:
        <HTMLSelect value={unit} minimal={true} onChange={(e) => { setUnit(e.target.value) }}>
          <option value="freq">Frequency (Hz)</option>
          <option value="freq-k">Frequency (kHz)</option>
          <option value="freq-m">Frequency (MHz)</option>
          <option value="freq-g">Frequency (GHz)</option>
          <option value="chan">Channel</option>
          <option value="vel">Velocity (km/s)</option>
        </HTMLSelect>

        <div style={{
          display: 'block', width: 200, padding: 30
        }}>
          x-axis preciesion:
          <Slider
            min={0}
            max={10}
            stepSize={1}
            labelStepSize={10}
            onChange={(value) => { setXPrecision(value) }}
            value={xPrecision}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
