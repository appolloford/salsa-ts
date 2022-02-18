import { useState, useEffect, useRef } from 'react';
import { Alignment, Button, Icon, Navbar, NavbarDivider, NavbarGroup, NavbarHeading } from '@blueprintjs/core';
import Viewer from './components/Viewer';
import Controller from './components/Controller';
import salsaSourceDef from './python/salsasource.py';
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
  const content = pyodide.globals.get("salsa")
  console.log("globals", content)

  return content
}

function App() {
  const pyodideObj = useRef<any>(null);
  const [loadPyodideOK, setLoadPyodideOK] = useState(false);
  const [newFileName, setNewfileName] = useState("");
  const [unit, setUnit] = useState("freq");

  const [selectMode, setSelectMode] = useState(false);

  const [baselinePoints, setBaselinePoints] = useState<number[][]>([]);
  const [isBaselineFitted, setIsBaselineFitted] = useState(false);
  const [showSubtraction, setShowSubtraction] = useState(false);

  const [cursorX, setCursorX] = useState(0);
  const [cursorY, setCursorY] = useState(0);

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

  const [dataSource, setDataSource] = useState<any>();

  const getData = async (file: File) => {
    const script = await (await fetch(salsaSourceDef)).text();
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

  const getBaselineFit = (points: number[][]) => {

    const xdata = points.map((item: number[]) => { return item[0] });
    const ydata = points.map((item: number[]) => { return item[1] });
    const result = dataSource?.fit_baseline(xdata, ydata, unit).toJs();
    setIsBaselineFitted(true);
  }

  return (
    <div className="App">
      <Navbar>
        <NavbarGroup align={Alignment.LEFT}>
          <NavbarHeading>SalsaTS</NavbarHeading>
          <NavbarDivider />
          <Button>
            <label htmlFor="input">
              <input type="file" id="input" hidden onChange={(e: any) => { readFile(e.target.files[0]) }} />
              <Icon icon="document" /> Upload
            </label>
          </Button>
        </NavbarGroup>
      </Navbar>
      <Viewer
        fileName={newFileName}
        dataSource={dataSource}
        unit={unit}
        selectMode={selectMode}
        baselinePoints={baselinePoints}
        isBaselineFitted={isBaselineFitted}
        setBaselinePoints={setBaselinePoints}
        showSubtraction={showSubtraction}
        setCursorX={setCursorX}
        setCursorY={setCursorY}
      />
      <h4>X: {cursorX} Y: {cursorY}</h4>
      <Controller
        unit={unit}
        setUnit={setUnit}
        selectMode={selectMode}
        setSelectMode={setSelectMode}
        baselinePoints={baselinePoints}
        getBaselineFit={getBaselineFit}
        showSubtraction={showSubtraction}
        setShowSubtraction={setShowSubtraction}
      />
    </div>
  );
}

export default App;
