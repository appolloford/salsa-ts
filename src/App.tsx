import { useState, useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';
import { FileInput } from '@blueprintjs/core';
import Viewer from './components/Viewer';
import script from './python/fitsreader.py';
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
  }, [loadPyodideOK]);

  const [plotdata, setPlotData] = useState([{}]);
  const [plotlayout, setPlotLayout] = useState(Viewer.defaultProps.layout);

  const readFile = (file: File) => {
    const reader = new FileReader()

    const getData = async () => {
      const scriptText = await (await fetch(script)).text();
      // console.log("script text", scriptText)
      let content = await runScript(pyodideObj.current, scriptText);
      // console.log("content", content)
      // console.log("header", content.header.toJs())
      const xdata = content.axisdata(1).toJs()
      const ydata = content.rawdata.toJs()[0][0]

      setPlotData([{
        x: xdata,
        y: ydata,
        type: 'scatter',
        mode: 'lines+markers',
      }])

      const newLayout = plotlayout
      newLayout.title.text = file.name
      newLayout.xaxis.title.text = content.header.toJs().get('CUNIT1')
      newLayout.yaxis.title.text = content.header.toJs().get('BUNIT')
      setPlotLayout(newLayout)
    }

    reader.onabort = () => console.log('file reading was aborted')
    reader.onerror = () => console.log('file reading has failed')
    reader.onload = () => {
      // Do whatever you want with the file contents
      window.jsarray = new Float32Array(reader.result as ArrayBuffer);
      // window.pyodide.loadPackage(['astropy']).then(() => {
      //   getData();
      // })
      getData();
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
      <Viewer data={plotdata} layout={plotlayout} />
    </div>
  );
}

export default App;
