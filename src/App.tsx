import { useState, useEffect, useRef } from 'react';
import { Alignment, Button, Card, Icon, Label, Navbar, NavbarDivider, NavbarGroup, NavbarHeading, Tabs, Tab } from '@blueprintjs/core';
import { Cell, Column, Table2 } from "@blueprintjs/table";
import Viewer from './components/Viewer';
import salsaSourceDef from './python/salsasource.py';
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from './redux/store'

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
  await pyodide.loadPackage(["astropy", "scipy"])
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

  const useStateRef = (initialValue: any) => {
    const [value, setValue] = useState(initialValue);

    const ref = useRef(value);

    useEffect(() => {
      ref.current = value;
    }, [value]);

    return [value, setValue, ref];
  }

  const [gaussianGuess, setGaussianGuess, gaussianGuessRef] = useStateRef([]);
  const [gaussianData, setGaussianData] = useState<number[]>([]);

  useEffect(() => {
    async function init() {
      if (!pyodideLoaded) {
        pyodideObj.current = await pyodideInstance();
        setPyodideLoaded(true)
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

  const getGaussianFit = (nGaussian: number) => {
    const result = dataSource?.fit_gaussian(unit, nGaussian, gaussianGuess).toJs();
    setGaussianData(result);
  }

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
            icon="link"
            text="Document"
            minimal={true}
            onClick={(e) => {
              e.preventDefault();
              window.open('https://github.com/appolloford/salsa-ts/wiki', '_blank', 'noopener,noreferrer');
            }}
          />
        </NavbarGroup>
      </Navbar>
      <Viewer
        fileName={newFileName}
        dataSource={dataSource}
        unit={unit}
        setUnit={setUnit}
        gaussianGuess={gaussianGuess}
        setGaussianGuess={setGaussianGuess}
        gaussianGuessRef={gaussianGuessRef}
        gaussianData={gaussianData}
        getGaussianFit={getGaussianFit}
      />
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1 }}>
          <Tabs>
            <Tab
              id="cursorpanel"
              title="Cursor Information"
              panel={
                <CursorInforPanel />
              }
            />
            <Tab
              id="baselinepoints"
              title="Selected Baseline Points"
              panel={
                <BaselinePointTable />
              }
            />
            <Tab
              id="gaussianranges"
              title="Selected Gaussian Ranges"
              panel={
                <GaussianGuessTable
                  gaussianGuess={gaussianGuess}
                />
              }
            />
          </Tabs>
        </div>
      </div>
    </div >
  );
}

const CursorInforPanel = (props: any) => {

  const position = useSelector((state: RootState) => state.cursor.position);
  return (
    <div style={{ textAlign: 'left' }}>
      <Label>Position: ({position[0].toFixed(6)}, {position[1].toFixed(6)})</Label>
    </div>
  )
}


const BaselinePointTable = (props: any) => {
  const baselinePoints = useSelector((state: RootState) => state.baseline.dataPoints)
  const pointX = (rowIndex: number) => (
    <Cell>{`${baselinePoints[rowIndex] ? (baselinePoints[rowIndex][0]).toFixed(6) : 0.0}`}</Cell>
  );
  const pointY = (rowIndex: number) => (
    <Cell>{`${baselinePoints[rowIndex] ? (baselinePoints[rowIndex][1]).toFixed(6) : 0.0}`}</Cell>
  );
  return (
    <Card style={{ display: "block", overflow: "auto", width: 600, height: 150 }}>
      <Table2 numRows={baselinePoints.length} enableGhostCells={true}>
        <Column name="X coordinate" cellRenderer={pointX} />
        <Column name="Y coordinate" cellRenderer={pointY} />
      </Table2>
    </Card>
  )
}

const GaussianGuessTable = (props: any) => {
  const gaussianGuess = props.gaussianGuess;

  const rangeX = (rowIndex: number) => (
    <Cell>
      ({`${gaussianGuess[rowIndex] ? (gaussianGuess[rowIndex][0]).toFixed(6) : 0.0}`},
      {`${gaussianGuess[rowIndex] ? (gaussianGuess[rowIndex][1]).toFixed(6) : 0.0}`})
    </Cell>
  );
  const rangeY = (rowIndex: number) => (
    <Cell>
      ({`${gaussianGuess[rowIndex] ? (gaussianGuess[rowIndex][2]).toFixed(6) : 0.0}`},
      {`${gaussianGuess[rowIndex] ? (gaussianGuess[rowIndex][3]).toFixed(6) : 0.0}`})
    </Cell>
  );
  return (
    <Card style={{ display: "block", overflow: "auto", width: 600, height: 150 }}>
      <Table2 numRows={gaussianGuess.length} enableGhostCells={true} columnWidths={[300, 200]}>
        <Column name="X range" cellRenderer={rangeX} />
        <Column name="Y range" cellRenderer={rangeY} />
      </Table2>
    </Card>
  )
}

export default App;
