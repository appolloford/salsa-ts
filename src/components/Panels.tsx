import { Button, Tabs, Tab, HTMLTable } from "@blueprintjs/core";
import BaselineTable from './BaselineTable';

const Panels = (props: any) => {

  const baselinePoints = props.baselinePoints;
  const getBaselineFit = props.getBaselineFit;

  return (
    <div>
      <Tabs id="viewerpanels" vertical={true}>
        <Tab id="generalpanel" title="General" />
        <Tab
          id="baselinepanel"
          title="Baseline"
          panel={<BaselinePanel baselinePoints={baselinePoints} getBaselineFit={getBaselineFit} />}
        />
      </Tabs>
    </div>
  )
};

const BaselinePanel = (props: any) => {
  const baselinePoints = props.baselinePoints;
  const getBaselineFit = props.getBaselineFit;
  return (
    <div>
      <HTMLTable striped={true} interactive={true} condensed={true}>
        <caption>baseline fitting points</caption>
        <thead style={{ display: "table" }}>
          <tr>
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

export default Panels;