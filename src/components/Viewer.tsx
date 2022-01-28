import { useRef, useState } from 'react';
import Canvas from './Canvas';


const Viewer = (props: any) => {
  const [cursorX, setCursorX] = useState(0);
  const [cursorY, setCursorY] = useState(0);

  const baselineData = props.baselineData;
  const selectMode = props.selectMode;
  const setBaselinePoints = props.setBaselinePoints;
  const showSubtraction = props.showSubtraction;

  const displayCursorPos = (x: number, y: number) => {
    setCursorX(x);
    setCursorY(y);
  };

  // const addBaselinePoints = (point: Array<number>) => {
  //   setBaselinePoints([...baselinePoints, point]);
  // };

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

  }

  return (
    <>
      <Canvas
        source={sourceData}
        baselineData={baselineData}
        options={options}
        onMouseMove={displayCursorPos}
        selectMode={selectMode}
        onSelect={setBaselinePoints}
        showSubtraction={showSubtraction}
      // onDrop={updateBaselinePoints}
      />
      <h4>X: {cursorX} Y: {cursorY}</h4>
    </>
  );
}


export default Viewer;