import { Button, HTMLSelect, HTMLTable, Label, Switch, Tabs, Tab } from "@blueprintjs/core";
import BaselineTable from './BaselineTable';

const Controller = (props: any) => {

  const unit = props.unit;
  const setUnit = props.setUnit;

  const selectMode = props.selectMode;
  const setSelectMode = props.setSelectMode;

  const baselinePoints = props.baselinePoints;
  const getBaselineFit = props.getBaselineFit;

  const showSubtraction = props.showSubtraction;
  const setShowSubtraction = props.setShowSubtraction;

  return (
    <div>
      <Tabs id="viewerpanels" vertical={true}>
        <Tab
          id="generalpanel"
          title="General"
          panel={<GeneralPanel unit={unit} setUnit={setUnit} />} />
        <Tab
          id="baselinepanel"
          title="Baseline"
          panel={
            <BaselinePanel
              selectMode={selectMode}
              setSelectMode={setSelectMode}
              baselinePoints={baselinePoints}
              getBaselineFit={getBaselineFit}
              showSubtraction={showSubtraction}
              setShowSubtraction={setShowSubtraction}
            />
          }
        />
      </Tabs>
    </div>
  )
};

const GeneralPanel = (props: any) => {

  const unit = props.unit;
  const setUnit = props.setUnit;

  return (
    <>
      <Label>
        x-axis unit:
        <HTMLSelect value={unit} minimal={true} onChange={(e) => { setUnit(e.target.value) }}>
          <option value="freq">Frequency (Hz)</option>
          <option value="freq-k">Frequency (kHz)</option>
          <option value="freq-m">Frequency (MHz)</option>
          <option value="freq-g">Frequency (GHz)</option>
          <option value="chan">Channel</option>
          <option value="vel">Velocity (km/s)</option>
        </HTMLSelect>
      </Label>
    </>
  )
}

const BaselinePanel = (props: any) => {

  const selectMode = props.selectMode;
  const setSelectMode = props.setSelectMode;

  const baselinePoints = props.baselinePoints;
  const getBaselineFit = props.getBaselineFit;

  const showSubtraction = props.showSubtraction;
  const setShowSubtraction = props.setShowSubtraction;

  return (
    <div>
      <Switch checked={selectMode} label="select baseline" onChange={() => { setSelectMode(!selectMode) }} />
      <Switch checked={showSubtraction} label="Show only subtraction" onChange={() => { setShowSubtraction(!showSubtraction) }} />
      <HTMLTable striped={true} interactive={true} condensed={true}>
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
          <BaselineTable baseline={baselinePoints} />
          {/* {baselinePoints.map(item => {
              return (
                <tr key={item[0]} onClick={() => { console.log("click table") }}>
                  <td>{item[0]}</td>
                  <td>{item[1]}</td>
                  <td><Button icon="cross" minimal={true} onClick={() => { setBaselinePoints(baselinePoints.filter(ele => ele !== item)) }} /></td>
                </tr>
              );
            })} */}
        </tbody>
      </HTMLTable>
      <Button text="Fit Baseline" onClick={() => { getBaselineFit(baselinePoints) }} />
    </div>
  )
}

export default Controller;