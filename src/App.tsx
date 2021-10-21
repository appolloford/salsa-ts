import { useState, useEffect, useRef, useCallback } from 'react';
import { FileInput } from '@blueprintjs/core';
import Viewer from './components/Viewer';
import { D4C } from "d4c-queue";
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

const d4c = new D4C();
const pyodideInstance = d4c.wrap(async () => {
  const pyodide = await window.loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/"
  });
  await pyodide.loadPackage("astropy")

  const scriptText = await (await fetch(script)).text();
  return { pyodide, scriptText }
});

const runScript = async (pyodide: any, code: string) => {
  await pyodide.runPythonAsync(code)
  const content = pyodide.globals.get("fitsreader")
  console.log("globals", content)

  return content
};

function App() {
  const pyodideObj = useRef<any>(null);
  const scriptObj = useRef<any>(null);
  const [loadPyodideOK, setLoadPyodideOK] = useState(false);
  useEffect(() => {
    async function init() {
      if (!loadPyodideOK) {
        const { pyodide, scriptText } = await pyodideInstance();
        pyodideObj.current = pyodide;
        scriptObj.current = scriptText
        setLoadPyodideOK(true)
      } else {
        console.log("no duplicate reload to avoid pyodide error")
      }
    }
    init()
  }, []);

  const [plotdata, setPlotData] = useState([{}]);
  const [plotlayout, setPlotLayout] = useState(Viewer.defaultProps.layout);

  const getData = useCallback(d4c.wrap(async (file: File) => {
    let content = await runScript(pyodideObj.current, scriptObj.current);
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
  }), []);

  const readFile = (file: File) => {
    const reader = new FileReader()

    reader.onabort = () => console.log('file reading was aborted')
    reader.onerror = () => console.log('file reading has failed')
    reader.onload = () => {
      // Do whatever you want with the file contents
      window.jsarray = new Float32Array(reader.result as ArrayBuffer);
      // window.pyodide.loadPackage(['astropy']).then(() => {
      //   getData();
      // })
      getData(file);
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
