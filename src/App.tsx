import { useState, useEffect, useRef } from 'react';
import { Alignment, Button, Card, Icon, Label, Navbar, NavbarDivider, NavbarGroup, NavbarHeading, Tabs, Tab, Drawer } from '@blueprintjs/core';
import { Cell, Column, Table2 } from "@blueprintjs/table";
import Viewer from './components/Viewer';
import salsaSourceDef from './python/salsasource.py';
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './redux/store'
import { toSciSymbol } from './Helper';

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
  await pyodide.loadPackage(["astropy", "scipy"]);
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
  const dispatch = useDispatch();
  const pyodideObj = useRef<any>(null);
  const [pyodideLoaded, setPyodideLoaded] = useState(false);
  const [newFileName, setNewfileName] = useState("");
  const [unit, setUnit] = useState("freq");
  const [dataSource, setDataSource] = useState<any>();

  useEffect(() => {
    async function init() {
      if (!pyodideLoaded) {
        pyodideObj.current = await pyodideInstance();
        setPyodideLoaded(true);
      } else {
        console.log("no duplicate reload to avoid pyodide error")
      }
    }
    init()
  });

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

  const [drawerstate, setDrawerState] = useState(true);
  return (
    <div className="App">
      <Navbar>
        <NavbarGroup align={Alignment.LEFT}>
          <NavbarHeading>SalsaTS</NavbarHeading>
          <NavbarDivider />
          <Button disabled={!pyodideLoaded} minimal={true}>
            <label htmlFor="input">
              <input type="file" id="input" hidden onChange={(e: any) => { readFile(e.target.files[0]) }} />
              <Icon icon="document" /> Upload
            </label>
          </Button>
        </NavbarGroup>
        <NavbarGroup align={Alignment.RIGHT}>
          <Button
            icon="help"
            text="Help"
            minimal={true}
            onClick={(e) => {
              e.preventDefault();
              window.open('https://github.com/appolloford/salsa-ts/wiki', '_blank', 'noopener,noreferrer');
            }}
          />
          <Button icon="app-header" text="Header" minimal={true} onClick={() => setDrawerState(true)} />
        </NavbarGroup>
      </Navbar>
      <Viewer
        fileName={newFileName}
        dataSource={dataSource}
        unit={unit}
        setUnit={setUnit}
      />
      <Drawer
        isOpen={drawerstate}
        onClose={() => setDrawerState(false)}
        children={<Card></Card>}
      />
    </div >
  );
}


export default App;
