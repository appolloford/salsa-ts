import { useState, useEffect, useRef } from 'react';
import { Alignment, Button, Card, Collapse, Divider, FormGroup, HTMLTable, Icon, Label, Navbar, NavbarDivider, NavbarGroup, NavbarHeading, RadioGroup, Radio, Tabs, Tab, Text } from '@blueprintjs/core';
import Viewer from './components/Viewer';
import Controller from './components/Controller';
import salsaSourceDef from './python/salsasource.py';
import { Provider, useSelector, useDispatch } from 'react-redux'
import { store, RootState } from './redux/store'
import { setDrag } from './redux/cursorSlice'

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
  const pyodideObj = useRef<any>(null);
  const [pyodideLoaded, setPyodideLoaded] = useState(false);
  const [newFileName, setNewfileName] = useState("");
  const [unit, setUnit] = useState("freq");

  const [baselinePoints, setBaselinePoints] = useState<number[][]>([]);
  const [isBaselineFitted, setIsBaselineFitted] = useState(false);
  const [showSubtraction, setShowSubtraction] = useState(false);

  const [gaussianGuess, setGaussianGuess] = useState<number[][]>([]);
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

  const getBaselineFit = () => {

    const points = baselinePoints;

    const xdata = points.map((item: number[]) => { return item[0] });
    const ydata = points.map((item: number[]) => { return item[1] });
    if (!xdata.length || !ydata.length) {
      dataSource.baseline = [];
      setIsBaselineFitted(false);
    }
    else {
      dataSource?.fit_baseline(xdata, ydata, unit);
      setIsBaselineFitted(true);
    }
  }

  const clearBaseline = () => {
    setBaselinePoints([])
    dataSource?.fit_baseline([], [], unit);
    setIsBaselineFitted(false);
  }

  const getGaussianFit = (nGaussian: number) => {
    const result = dataSource?.fit_gaussian(unit, nGaussian, gaussianGuess).toJs();
    setGaussianData(result);
  }

  return (
    <Provider store={store}>
      <div className="App">
        <Navbar>
          <NavbarGroup align={Alignment.LEFT}>
            <NavbarHeading>SalsaTS</NavbarHeading>
            <NavbarDivider />
            <Button disabled={!pyodideLoaded}>
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
          // baselinePoints={baselinePoints}
          gaussianGuess={gaussianGuess}
          isBaselineFitted={isBaselineFitted}
          setBaselinePoints={setBaselinePoints}
          setGaussianGuess={setGaussianGuess}
          showSubtraction={showSubtraction}
          gaussianData={gaussianData}
        />
        <div style={{ display: "flex" }}>
          <Controller
            style={{ flex: 1 }}
            unit={unit}
            setUnit={setUnit}
            // baselinePoints={baselinePoints}
            clearBaseline={clearBaseline}
            getBaselineFit={getBaselineFit}
            showSubtraction={showSubtraction}
            setShowSubtraction={setShowSubtraction}
            getGaussianFit={getGaussianFit}
          />
          <Divider />
          <div style={{ flex: 1 }}>
            <Tabs>
              <Tab
                id="cursorpanel"
                title="Cursor Information"
                panel={
                  <CursorInforPanel
                    isBaselineFitted={isBaselineFitted}
                    showSubtraction={showSubtraction}
                  />
                }
              />
              <Tab
                id="baselinepoints"
                title="Selected Baseline Points"
                panel={
                  <BaselinePointTable
                    baselinePoints={baselinePoints}
                  />
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
    </Provider>
  );
}

const CursorInforPanel = (props: any) => {
  const isBaselineFitted = props.isBaselineFitted;
  const showSubtraction = props.showSubtraction;

  const position = useSelector((state: RootState) => state.cursor.position);
  const drag = useSelector((state: RootState) => state.cursor.drag);
  const dispatch = useDispatch();
  return (
    <div style={{ textAlign: 'left' }}>
      <Label>Position: ({position[0]}, {position[1]})</Label>
      <FormGroup label="Drag Action:" inline={true}>
        <RadioGroup
          onChange={(e: any) => { dispatch(setDrag(e.target.defaultValue)) }}
          selectedValue={drag}
          inline={true}
        >
          <Radio label="Zoom" value="zoom" />
          <Radio label="Baseline" value="baseline" />
          <Radio label="Gaussian" value="gaussian" disabled={!isBaselineFitted || !showSubtraction} />
        </RadioGroup>
      </FormGroup>
    </div>
  )
}


const BaselinePointTable = (props: any) => {
  const baselinePoints = props.baselinePoints;
  return (
    <Card>
      <HTMLTable striped={true} condensed={true} interactive={true}>
        {/* <caption>Selected Baseline Points</caption> */}
        <thead style={{ display: "table" }}>
          <tr>
            <th style={{ width: 140 }}>Selected Points</th>
            <th style={{ width: 140 }}>X coordinate</th>
            <th style={{ width: 140 }}>Y coordinate</th>
            {/* <th><Button icon="trash" text="Clear All" onClick={() => { setBaselinePoints([]) }} /></th> */}
          </tr>
        </thead>
        <tbody style={{ display: "block", overflow: "auto", height: 150 }}>
          {
            baselinePoints.map((item: any, index: number) => {
              return (
                <tr style={{ display: "table" }} key={item[0]} onClick={() => { console.log("click table") }}>
                  <td style={{ width: 140, textAlign: 'left' }}>{index}</td>
                  <td style={{ width: 140, textAlign: 'left' }}>{item[0].toFixed(6)}</td>
                  <td style={{ width: 140, textAlign: 'left' }}>{item[1].toFixed(6)}</td>
                  {/* <td><Button icon="cross" minimal={true} onClick={() => { setBaselinePoints(baselinePoints.filter(ele => ele !== item)) }} /></td> */}
                </tr>);
            })
          }
        </tbody>
      </HTMLTable>
    </Card>
  )
}

const GaussianGuessTable = (props: any) => {
  const gaussianGuess = props.gaussianGuess;

  return (
    <>
      <Card>
        <HTMLTable striped={true} condensed={true} interactive={true}>
          {/* <caption>Selected Baseline Points</caption> */}
          <thead style={{ display: "table" }}>
            <tr>
              <th style={{ width: 140 }}>Selected Range</th>
              <th style={{ width: 200 }}>X range</th>
              <th style={{ width: 200 }}>Y range</th>
              {/* <th><Button icon="trash" text="Clear All" onClick={() => { setBaselinePoints([]) }} /></th> */}
            </tr>
          </thead>
          <tbody style={{ display: "block", overflow: "auto", height: 150 }}>
            {
              gaussianGuess.map((item: any, index: number) => {
                return (
                  <tr style={{ display: "table" }} key={item[0]} onClick={() => { console.log("click table") }}>
                    <td style={{ width: 140, textAlign: 'left' }}>{index}</td>
                    <td style={{ width: 200, textAlign: 'left' }}>({item[0].toFixed(6)}, {item[1].toFixed(6)})</td>
                    <td style={{ width: 200, textAlign: 'left' }}>({item[2].toFixed(6)}, {item[3].toFixed(6)})</td>
                    {/* <td><Button icon="cross" minimal={true} onClick={() => { setBaselinePoints(baselinePoints.filter(ele => ele !== item)) }} /></td> */}
                  </tr>);
              })
            }
          </tbody>
        </HTMLTable>
      </Card>
    </>
  )
}

export default App;
