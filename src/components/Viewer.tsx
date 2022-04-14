import { useRef, useState, memo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HC_exporting from 'highcharts/modules/exporting';

HC_exporting(Highcharts);
require("highcharts/modules/draggable-points")(Highcharts);


const Viewer = memo((props: any) => {

  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);
  const chart = chartComponentRef.current?.chart;

  // const selectMode = props.selectMode;
  const isSelecting = props.cursorDragMode === "baseline" || props.cursorDragMode === "gaussian";
  const setBaselinePoints = props.setBaselinePoints;
  const gaussianGuess = props.gaussianGuess;
  const setGaussianGuess = props.setGaussianGuess;
  const showSubtraction = props.showSubtraction;
  const isBaselineFitted = props.isBaselineFitted;

  const gaussianData = props.gaussianData;

  const selectPointsByDrag = (e: any) => {

    // const chart = chartComponentRef.current?.chart;

    console.log(e)
    console.log(chart)
    console.log("chart option", chart?.options)

    if (chart?.series) {
      chart.series.forEach(
        (series: any) => {
          // check the series is selectable, don't select the points on fitting line
          if (series.options.allowPointSelect === true) {
            series?.points.forEach(
              (point: any) => {
                if (point.x >= e.xAxis[0].min && point.x <= e.xAxis[0].max &&
                  point.y >= e.yAxis[0].min && point.y <= e.yAxis[0].max) {
                  point.select(true, true);
                }
              }
            )
          }
        }
      )
    }

    if (props.cursorDragMode === "baseline") {
      const data = chart?.getSelectedPoints().map(
        (point) => { return [point.x, point.y] }
      )
      setBaselinePoints(data);
    }

    // Fire a custom event
    // console.log("highchart", Highcharts);
    // Highcharts.fireEvent(chart, 'selectedpoints', { points: chart?.getSelectedPoints() });

    return false; // Don't zoom
  }

  const selectRange = (e: any) => {

    // const chart = chartComponentRef.current?.chart;

    // console.log(e)
    // console.log(chart)
    // console.log("chart option", chart?.options)

    const xmin = e.xAxis[0].min;
    const xmax = e.xAxis[0].max;
    const ymin = e.yAxis[0].min;
    const ymax = e.yAxis[0].max;

    if (props.cursorDragMode === "gaussian") {
      setGaussianGuess([...gaussianGuess, [(xmin + xmax) / 2, (xmax - xmin), ymax]]);
    }

    console.log(gaussianGuess);

    // Fire a custom event
    // console.log("highchart", Highcharts);
    // Highcharts.fireEvent(chart, 'selectedpoints', { points: chart?.getSelectedPoints() });

    return false; // Don't zoom
  }

  let selectionFunction;
  if (props.cursorDragMode === "baseline") {
    selectionFunction = selectPointsByDrag;
  }
  else if (props.cursorDragMode === "gaussian") {
    selectionFunction = selectRange;
  }

  function unselectByClick() {
    const points = chart?.getSelectedPoints();
    if (points?.length && points.length > 0) {
      points.forEach((point) => {
        point.select(false);
      })
    }
    setBaselinePoints([]);
  }

  const setCursorX = props.setCursorX;
  const setCursorY = props.setCursorY;

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
  let xdisplayUnit;

  if (unit === "freq-k") {
    xdisplayUnit = "kHz";
  } else if (unit === "freq-m") {
    xdisplayUnit = "MHz";
  } else if (unit === "freq-g") {
    xdisplayUnit = "GHz";
  } else if (unit === "chan") {
    xdisplayUnit = "Channel";
  } else if (unit === "vel") {
    xdisplayUnit = "Velocity (km/s)";
  } else {
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

    const xdata = dataSource.axisdata(1, unit).toJs();
    const ydata = dataSource.rawdata.toJs()[0][0];
    const header = dataSource.header.toJs();

    const xdataArray = [].slice.call(xdata);
    sourceData = xdataArray.map((xi: number, i: number) => {
      return [xi, ydata[i]];
    });

    // create dummy baseline array and updated the value if fitting has done
    const baselineData = xdataArray.map((xi: number, i: number) => {
      return [xi, 0.0];
    });

    if (isBaselineFitted === true) {
      const ydata = dataSource.baseline.toJs();
      baselineData.forEach((item: number[], i: number) => {
        item[1] = ydata[i];
      });
    }

    // create subtracted data if the option is selected
    if (showSubtraction === true) {
      const subtractedData = sourceData.map(
        (item: number[], idx: number) => {
          return [item[0], item[1] - baselineData[idx][1]]
        }
      )
      options.series = [
        {
          name: 'Observation - Baseline',
          type: 'scatter',
          data: subtractedData,
          findNearestPointBy: 'xy',
        },
      ];
    }
    else {
      options.series = [
        {
          name: 'Observation',
          type: 'scatter',
          lineWidth: 2,
          data: sourceData,
          allowPointSelect: isSelecting,
          findNearestPointBy: 'xy',
        },
        // {
        //   name: "Baseline",
        //   type: "scatter",
        //   data: props.baselinePoints,
        //   dragDrop: {
        //     draggableX: true,
        //     draggableY: true
        //   },
        // },
      ];

      // add another label if we plot both original data and baseline
      if (isBaselineFitted === true) {
        options.series.push({
          name: 'Baseline fitting',
          type: 'line',
          data: baselineData,
          allowPointSelect: false,
          colorIndex: 3,
        })
      }
      console.log("series", options.series);
    }

    if (gaussianData) {
      const gaussian = xdataArray.map((xi: number, i: number) => {
        return [xi, 0.0];
      });
      gaussian.forEach((item: number[], i: number) => {
        item[1] = gaussianData[i];
      });
      options.series.push(
        {
          name: 'Gaussian',
          type: 'line',
          data: gaussian,
          findNearestPointBy: 'xy',
        },
      );
    }

    // options.series = [
    //   {
    //     name: "Observation",
    //     type: 'line',
    //     data: sourceData,
    //     allowPointSelect: selectMode,
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

    const subtitle = `${header.get("CTYPE2")}: ${header.get("CRVAL2")}, ${header.get("CTYPE3")}: ${header.get("CRVAL3")}`;

    options.title = {
      text: fileName
    };

    options.subtitle = {
      text: subtitle
    };

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

  if (isSelecting === true && options.chart) {
    options.chart.zoomType = 'xy';
    options.chart.events = {
      selection: selectionFunction,
      click: unselectByClick,
    };
  }
  else if (options.chart) {
    options.chart.zoomType = 'x';
    options.chart.events = {
      selection: undefined,
      click: undefined,
      render: undefined,
    }
  }

  console.log("options", options)

  const getCursorPos = (event: any) => {
    let xPos = 0.0;
    let yPos = 0.0;
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
        xPos = chart.xAxis[0].toValue(x, true);
        yPos = chart.yAxis[0].toValue(y, true);
      }
      // console.log(event);
    }
    // console.log(event);
    return { xPos, yPos };
  }

  const handleMouseMove = (event: any) => {
    const { xPos, yPos } = getCursorPos(event);
    setCursorX(xPos);
    setCursorY(yPos);
  };

  return (
    <>
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        ref={chartComponentRef}
        containerProps={{
          onMouseMove: handleMouseMove,
          // onDoubleClick: handleDoubleClick,
        }}
      />
    </>
  );
});


export default Viewer;