import { useRef, useState, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../redux/store';
import { setDrag, setPosition } from '../redux/cursorSlice';
import { setDataPoints, setFitValues, setSubtraction } from '../redux/baselineSlice';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HC_exporting from 'highcharts/modules/exporting';
import { Button, Classes, ButtonGroup, Divider, FormGroup, HTMLSelect, NumericInput, Position } from '@blueprintjs/core';
import { Popover2, Tooltip2 } from "@blueprintjs/popover2";

HC_exporting(Highcharts);
require("highcharts/modules/draggable-points")(Highcharts);


const Viewer = memo((props: any) => {

  const dispatch = useDispatch();
  const drag = useSelector((state: RootState) => state.cursor.drag);
  const isSelecting = drag === "baseline" || drag === "gaussian";

  const baselineFit = useSelector((state: RootState) => state.baseline.fitValues);
  const subtraction = useSelector((state: RootState) => state.baseline.subtraction);
  const isBaselineFitted = baselineFit.length > 0;

  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);
  const chart = chartComponentRef.current?.chart;

  const gaussianGuess = props.gaussianGuess;
  const setGaussianGuess = props.setGaussianGuess;

  const gaussianData = props.gaussianData;
  const getGaussianFit = props.getGaussianFit;

  const fileName = props.fileName;
  const dataSource = props.dataSource;
  const unit = props.unit;
  const setUnit = props.setUnit;

  const [rectangles, setRectangles] = useState<any[]>([]);

  const selectPoints = (e: any) => {

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

    const data = chart?.getSelectedPoints().map(
      (point) => { return [point.x || 0.0, point.y || 0.0] }
    ) || [];

    dispatch(setDataPoints(data));

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

    const xminpix = chart?.xAxis[0].toPixels(xmin, false) || 0;
    const xmaxpix = chart?.xAxis[0].toPixels(xmax, false) || 0;
    const yminpix = chart?.yAxis[0].toPixels(ymin, false) || 0;
    const ymaxpix = chart?.yAxis[0].toPixels(ymax, false) || 0;
    const width = xmaxpix - xminpix;
    const height = yminpix - ymaxpix;

    console.log("rect params", xminpix, ymaxpix, width, height)

    const rectangle = chart?.renderer.rect(xminpix, ymaxpix, width, height, 2)
      .attr({
        "stroke-width": 2,
        "stroke": 'red',
        "fill": 'black',
        "fill-opacity": 0.1,
        "zIndex": 3
      })
      .add();

    setGaussianGuess([...gaussianGuess, [xmin, xmax, ymin, ymax]]);
    setRectangles([...rectangles, rectangle]);

    // Fire a custom event
    // console.log("highchart", Highcharts);
    // Highcharts.fireEvent(chart, 'selectedpoints', { points: chart?.getSelectedPoints() });

    return false; // Don't zoom
  }

  let selectionFunction;
  if (drag === "baseline") {
    selectionFunction = selectPoints;
  }
  else if (drag === "gaussian") {
    selectionFunction = selectRange;
  }

  function unselectByClick() {
    const points = chart?.getSelectedPoints();
    if (points?.length && points.length > 0) {
      points.forEach((point) => {
        point.select(false);
      })
    }
    dispatch(setDataPoints([]));
  }

  // const setCursorX = props.setCursorX;
  // const setCursorY = props.setCursorY;

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
      baselineData.forEach((item: number[], i: number) => {
        item[1] = baselineFit[i];
      });
    }

    // create subtracted data if the option is selected
    if (subtraction === true) {
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
          colorIndex: 5,
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

    const subtitle = `${header.get("CTYPE2")}: ${header.get("CRVAL2").toFixed(6)}, ${header.get("CTYPE3")}: ${header.get("CRVAL3").toFixed(6)}`;

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
    options.chart.renderTo = chart?.container;
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
    dispatch(setPosition([xPos, yPos]));
    // setCursorX(xPos);
    // setCursorY(yPos);
  };

  return (
    <div>
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        ref={chartComponentRef}
        containerProps={{
          onMouseMove: handleMouseMove,
          // onDoubleClick: handleDoubleClick,
        }}
      />
      <Toolbar
        unit={unit}
        setUnit={setUnit}
        dataSource={dataSource}
        getGaussianFit={getGaussianFit}
      />
    </div>
  );
});

const Toolbar = (props: any) => {
  const dispatch = useDispatch();
  const drag = useSelector((state: RootState) => state.cursor.drag);
  const baselinePoints = useSelector((state: RootState) => state.baseline.dataPoints);
  const baselineFit = useSelector((state: RootState) => state.baseline.fitValues);
  const subtraction = useSelector((state: RootState) => state.baseline.subtraction);
  const isBaselineFitted = baselineFit.length > 0;
  const xdata = baselinePoints.map((item: number[]) => { return item[0] });
  const ydata = baselinePoints.map((item: number[]) => { return item[1] });

  const dataSource = props.dataSource;
  const getGaussianFit = props.getGaussianFit;
  const unit = props.unit;
  const setUnit = props.setUnit;
  const [order, setOrder] = useState(0);
  const [isFitting, setIsFitting] = useState(false);

  const fitBaseline = (x: number[], y: number[]) => {
    const result = dataSource?.fit_baseline(x, y, unit).toJs();
    const baselineFit = [].slice.call(result);
    dispatch(setFitValues(baselineFit));
  }

  return (
    <div style={{ display: "flex" }}>
      <ButtonGroup>
        <Button
          icon="zoom-in"
          small={true}
          active={drag === "zoom"}
          onClick={() => { dispatch(setDrag("zoom")) }}
        />
        <Button
          icon="widget-button"
          small={true}
          active={drag === "baseline"}
          disabled={subtraction}
          onClick={() => { dispatch(setDrag("baseline")) }}
        />
        <Button
          icon="widget"
          small={true}
          active={drag === "gaussian"}
          disabled={!isBaselineFitted || !subtraction}
          onClick={() => { dispatch(setDrag("gaussian")) }}
        />
      </ButtonGroup>
      <Divider />
      <Button
        icon="bring-data"
        small={true}
        active={subtraction}
        onClick={() => {
          dispatch(setSubtraction(!subtraction));
          dispatch(setDrag("zoom"));
        }}
      />
      <Button
        icon="regression-chart"
        small={true}
        disabled={!baselinePoints.length}
        onClick={() => { fitBaseline(xdata, ydata) }}
      />
      <Button
        icon="delete"
        small={true}
        onClick={() => {
          dispatch(setDataPoints([]));
          fitBaseline([], []);
        }}
      />
      <Divider />
      <Tooltip2
        className={Classes.TOOLTIP_INDICATOR}
        content="Fit Gaussian"
        position={Position.TOP_LEFT}
        minimal={true}
      >
        <Button
          icon="step-chart"
          small={true}
          active={isFitting}
          onClick={() => {
            if (isFitting) {
              getGaussianFit(0);
            }
            else {
              getGaussianFit(order);
            }
            setIsFitting(!isFitting);
          }}
        />
      </Tooltip2>
      <Popover2
        content={
          <NumericInput
            style={{ width: 30 }}
            value={order}
            min={0}
            onValueChange={(value) => {
              setOrder(value);
              if (isFitting) getGaussianFit(value);
            }}
          />
        }
      >
        <Tooltip2
          content="Number of Gaussian peaks"
          position={Position.TOP_LEFT}
          minimal={true}
        >
          <Button text={order} small={true} />
        </Tooltip2>
      </Popover2>

      <FormGroup style={{ marginLeft: "auto", height: 10 }} label="x-axis unit:" inline={true}>
        <HTMLSelect value={unit} minimal={true} onChange={(e) => { setUnit(e.target.value) }}>
          <option value="freq">Frequency (Hz)</option>
          <option value="freq-k">Frequency (kHz)</option>
          <option value="freq-m">Frequency (MHz)</option>
          <option value="freq-g">Frequency (GHz)</option>
          <option value="chan">Channel</option>
          <option value="vel">Velocity (km/s)</option>
        </HTMLSelect>
      </FormGroup>
    </div>
  )
}

export default Viewer;