import { useRef, useState } from 'react';
// import HighchartsReact from 'highcharts-react-official';
import { Button, HTMLTable } from "@blueprintjs/core";
import Canvas from './Canvas';


const Viewer = (props: any) => {
  // const chartComponentRef = useRef<HighchartsReact.RefObject>(null);
  const [cursorX, setCursorX] = useState(0);
  const [cursorY, setCursorY] = useState(0);
  const [baselinePoints, setBaselinePoints] = useState<number[][]>([]);

  const getCursorPos = (chart: any, event: any) => {
    let xvalue = 0.0;
    let yvalue = 0.0;
    if (chart) {
      const e = chart.pointer.normalize(event);
      const x = e.chartX - chart.plotLeft;
      const y = e.chartY - chart.plotTop;
      // const top = chart.container.offsetTop;
      // const left = chart.container.offsetLeft;
      // const x = event.clientX - chart.plotLeft - left;
      // const y = event.clientY - chart.plotTop - top;
      if (x >= 0 && y >= 0 && x <= chart.chartWidth && y <= chart.chartHeight) {
        // console.log(chart.xAxis[0].toValue(x, true));
        // console.log(chart.yAxis[0].toValue(chart.plotHeight - y, true));
        // setCursorX(chart.xAxis[0].toValue(x, true));
        // setCursorY(chart.yAxis[0].toValue(y, true));
        xvalue = chart.xAxis[0].toValue(x, true);
        yvalue = chart.yAxis[0].toValue(y, true);
      }
    }
    return { xvalue, yvalue };
  }

  const handleMouseMove = (event: any, chart: any) => {
    // const chart = event.target.series.chart;
    // const chart = chartComponentRef.current?.chart;
    // console.log(chart);
    // console.log(event);
    // console.log(Highcharts);
    // console.log(chartComponentRef);
    // console.log(event.target);
    // console.log(event.target.tooltipPos);

    const { xvalue, yvalue } = getCursorPos(chart, event);
    setCursorX(xvalue);
    setCursorY(yvalue);

  };

  const addBaselinePoints = (point: Array<number>) => {
    setBaselinePoints([...baselinePoints, point]);
  };

  const handleDoubleClick = (event: any, chart: any, callback: Function) => {
    // const chart = chartComponentRef.current?.chart;
    const { xvalue, yvalue } = getCursorPos(chart, event);
    callback([xvalue, yvalue]);
  };


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
      zoomType: 'x'
    },
    tooltip: {
      enabled: true
    },
    plotOptions: {
      series: {
        enableMouseTracking: true,
        tooltip: {
          followPointer: false
        },
      },
    },
  };

  if (dataSource) {

    const xdata = dataSource.axisdata(1, unit, order).toJs();
    const ydata = dataSource.rawdata.toJs()[0][0];
    const header = dataSource.header.toJs();

    const xdataArray = [].slice.call(xdata);
    const seriesData = xdataArray.map((xi: number, i: number) => {
      return [xi, ydata[i]];
    });

    options.series = [
      {
        name: fileName,
        type: 'line',
        data: seriesData,
      },
      {
        name: "Baseline",
        type: "scatter",
        data: baselinePoints,
      }
    ];

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
        options={options}
        onMouseMove={handleMouseMove}
        onDoubleClick={(event: any, chart: any) => { handleDoubleClick(event, chart, addBaselinePoints) }}
      />
      <h4>X: {cursorX} Y: {cursorY}</h4>
      <div>
        <HTMLTable striped={true} interactive={true} condensed={true}>
          <caption>baseline fitting points</caption>
          <thead>
            <tr>
              <th>X coordinate</th>
              <th>Y coordinate</th>
              <th><Button icon="trash" text="Clear All" onClick={() => { setBaselinePoints([]) }} /></th>
            </tr>
          </thead>
          <tbody>
            {baselinePoints.map(item => {
              return (
                <tr key={item[0]} onClick={() => { console.log("click table") }}>
                  <td>{item[0]}</td>
                  <td>{item[1]}</td>
                  <td><Button icon="cross" minimal={true} onClick={() => { setBaselinePoints(baselinePoints.filter(ele => ele !== item)) }} /></td>
                </tr>
              );
            })}
          </tbody>
        </HTMLTable>
      </div>
    </>
  );
}


export default Viewer;