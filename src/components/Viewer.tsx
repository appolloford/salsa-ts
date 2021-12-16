import { useRef, useState } from 'react';
import { Button, HTMLTable } from "@blueprintjs/core";
import Canvas from './Canvas';
import Panels from './Panels';


const Viewer = (props: any) => {
  const [cursorX, setCursorX] = useState(0);
  const [cursorY, setCursorY] = useState(0);
  const [baselinePoints, setBaselinePoints] = useState<number[][]>([]);
  const [baselineData, setBaselineData] = useState<number[][]>([])

  const displayCursorPos = (x: number, y: number) => {
    setCursorX(x);
    setCursorY(y);
  };

  const addBaselinePoints = (point: Array<number>) => {
    setBaselinePoints([...baselinePoints, point]);
  };

  // TODO: update table when drag and drop
  // const updateBaselinePoints = (oldPoint: Array<number>, newPoint: Array<number>) => {
  //   // console.log("update", oldPoint, newPoint);
  //   // const test = baselinePoints.map((x, i) => [i, x]);
  //   // console.log("test", test)
  //   // const targetIdx = baselinePoints.filter((ele) => {
  //   //   console.log("filter", ele)
  //   //   return ele[0] === oldPoint[0] && ele[1] === oldPoint[1]
  //   // });
  //   // console.log("idx:", targetIdx);
  //   console.log("a", baselinePoints);
  //   setBaselinePoints([...baselinePoints]);
  //   console.log("b", baselinePoints);
  //   // setBaselinePoints(baselinePoints[baselinePoints.map((x, i) => [i, x]).filter(
  //   //   x => x[1] == point)[0][0]] = point);
  // }

  const fileName = props.fileName;
  const dataSource = props.dataSource;
  const unit = props.unit;
  const xPrecision = props.xPrecision;
  let order, xdisplayUnit;

  if (unit === "freq-k") {
    order = 3;
    xdisplayUnit = "kHz";
  } else if (unit === "freq-m") {
    order = 6;
    xdisplayUnit = "MHz";
  } else if (unit === "freq-g") {
    order = 9;
    xdisplayUnit = "GHz";
  } else if (unit === "chan") {
    order = 0;
    xdisplayUnit = "Channel";
  } else if (unit === "vel") {
    order = 0;
    xdisplayUnit = "Velocity (km/s)";
  } else {
    order = 0;
    xdisplayUnit = "Hz";
  }

  const options: Highcharts.Options = {
    chart: {
      zoomType: 'x',
    },
    tooltip: {
      enabled: true
    },
    plotOptions: {
      series: {
        enableMouseTracking: true,
        tooltip: {
          followPointer: false,
        },
      },
    },
  };

  const clearBaselineData = () => { setBaselineData([]) };

  const getBaselineFit = (points: number[][]) => {

    console.log("get fits point", points);
    if (points.length === 0) {
      clearBaselineData();
      return;
    }

    const xdata = points.map((item: number[]) => { return item[0] });
    const ydata = points.map((item: number[]) => { return item[1] });
    const result = dataSource?.fit_baseline_point(xdata, ydata, unit).toJs() || baselinePoints;
    // make Float64Array to Array
    const data = result.map((item: number[]) => {
      return [item[0], item[1]]
    })
    console.log(data)
    setBaselineData(data);
  }

  let sourceData: number[][] = [];

  if (dataSource) {

    const xdata = dataSource.axisdata(1, unit, order).toJs();
    const ydata = dataSource.rawdata.toJs()[0][0];
    const header = dataSource.header.toJs();

    const xdataArray = [].slice.call(xdata);
    sourceData = xdataArray.map((xi: number, i: number) => {
      return [xi, ydata[i]];
    });

    // options.series = [
    //   {
    //     name: "Observation",
    //     type: 'line',
    //     data: sourceData,
    //     allowPointSelect: props.selectMode,
    //   },
    //   {
    //     name: "Baseline",
    //     type: "scatter",
    //     data: baselinePoints,
    //     dragDrop: {
    //       draggableX: true,
    //       draggableY: true
    //     },
    //   }
    // ];

    const xAxis = {
      title: {
        text: xdisplayUnit,
      },
      // labels: {
      //   format: '{value:.2f}',
      // }
    };
    const yAxis = {
      title: {
        text: header.get('BUNIT'),
      }
    };

    options.xAxis = xAxis;
    options.yAxis = yAxis;

    // plotLayout.xaxis.tickformat = `.${xPrecision}r`;

  }

  return (
    <>
      <Canvas
        source={sourceData}
        // baselinePoints={baselinePoints}
        baselineData={baselineData}
        options={options}
        onMouseMove={displayCursorPos}
        onDoubleClick={addBaselinePoints}
        selectMode={props.selectMode}
        onSelect={setBaselinePoints}
      // onDrop={updateBaselinePoints}
      />
      <h4>X: {cursorX} Y: {cursorY}</h4>
      <Panels baselinePoints={baselinePoints} getBaselineFit={getBaselineFit} />
    </>
  );
}


export default Viewer;