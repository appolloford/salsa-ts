import { Button, FormGroup, HTMLSelect, HTMLTable, NumericInput, Switch, Tabs, Tab, Divider } from "@blueprintjs/core";
import { useState } from "react";
import BaselineTable from './BaselineTable';

const Controller = (props: any) => {

  const unit = props.unit;
  const setUnit = props.setUnit;

  // const selectMode = props.selectMode;
  // const setSelectMode = props.setSelectMode;

  // const baselinePoints = props.baselinePoints;
  const getBaselineFit = props.getBaselineFit;

  const showSubtraction = props.showSubtraction;
  const setShowSubtraction = props.setShowSubtraction;

  const [nGaussian, setNGaussian] = useState(1);
  const getGaussianFit = props.getGaussianFit;
  const clearBaseline = props.clearBaseline;

  return (
    <div style={props.style}>
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
              // selectMode={selectMode}
              // setSelectMode={setSelectMode}
              // baselinePoints={baselinePoints}
              clearBaseline={clearBaseline}
              getBaselineFit={getBaselineFit}
              showSubtraction={showSubtraction}
              setShowSubtraction={setShowSubtraction}
            />
          }
        />
        <Tab
          id="gaussianpanel"
          title="Gaussian"
          panel={<GaussianPanel nGaussian={nGaussian} setNGaussian={setNGaussian} getGaussianFit={getGaussianFit} />}
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
      <FormGroup label="x-axis unit:" inline={true}>
        <HTMLSelect value={unit} minimal={true} onChange={(e) => { setUnit(e.target.value) }}>
          <option value="freq">Frequency (Hz)</option>
          <option value="freq-k">Frequency (kHz)</option>
          <option value="freq-m">Frequency (MHz)</option>
          <option value="freq-g">Frequency (GHz)</option>
          <option value="chan">Channel</option>
          <option value="vel">Velocity (km/s)</option>
        </HTMLSelect>
      </FormGroup>
    </>
  )
}

const BaselinePanel = (props: any) => {

  // const selectMode = props.selectMode;
  // const setSelectMode = props.setSelectMode;

  // const baselinePoints = props.baselinePoints;
  const clearBaseline = props.clearBaseline;
  const getBaselineFit = props.getBaselineFit;

  const showSubtraction = props.showSubtraction;
  const setShowSubtraction = props.setShowSubtraction;

  return (
    <div>
      {/* <Switch checked={selectMode} label="select baseline" onChange={() => { setSelectMode(!selectMode) }} /> */}
      <Switch checked={showSubtraction} label="Show only subtraction" onChange={() => { setShowSubtraction(!showSubtraction) }} />
      <Button text="Clear" onClick={() => { clearBaseline() }} />
      <Button text="Fit Baseline" onClick={() => { getBaselineFit() }} />
    </div>
  )
}

const GaussianPanel = (props: any) => {
  const nGaussian = props.nGaussian;
  const setNGaussian = props.setNGaussian;
  const getGaussianFit = props.getGaussianFit;
  const [fitGaussian, setFitGaussian] = useState(false);
  return (
    <div>
      <Switch
        checked={fitGaussian}
        label="Fit Gaussian"
        onChange={() => {
          setFitGaussian(!fitGaussian);
          getGaussianFit(nGaussian);
        }}
      />
      <NumericInput
        value={nGaussian}
        min={1}
        onValueChange={(value) => {
          setNGaussian(value);
          if (fitGaussian) getGaussianFit(value);
        }}
      />
    </div>
  )
}

export default Controller;