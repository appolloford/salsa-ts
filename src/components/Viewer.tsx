import { useEffect, useRef, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../redux/store';
import { setPosition } from '../redux/cursorSlice';
import { setBaselinePoints, setBaselineFit } from '../redux/baselineSlice';
import { setGaussianGuess, setGaussianParams, setGaussianSingleFit, setGaussianStack } from '../redux/gaussianSlice';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HC_more from 'highcharts/highcharts-more';
import HC_exporting from 'highcharts/modules/exporting';
import { Card, Collapse, Divider } from '@blueprintjs/core';
import { Cell, Column, Table2 } from "@blueprintjs/table";
import { toSciSymbol } from "../Helper";
import Toolbar from './Toolbar';

HC_more(Highcharts);
HC_exporting(Highcharts);
require("highcharts/modules/draggable-points")(Highcharts);
require("highcharts/modules/accessibility")(Highcharts);


const Viewer = memo((props: any) => {

  const dispatch = useDispatch();
  const drag = useSelector((state: RootState) => state.cursor.drag);

  const baselineFitValues = useSelector((state: RootState) => state.baseline.baselineFitValues);
  const baselineFitOrder = useSelector((state: RootState) => state.baseline.baselineFitOrder);
  const showSubtraction = useSelector((state: RootState) => state.baseline.showSubtraction);
  const showBaselineTable = useSelector((state: RootState) => state.baseline.showBaselineTable);
  const isBaselineFitted = baselineFitValues.length > 0;

  const order = useSelector((state: RootState) => state.gaussian.order);
  const isFitting = useSelector((state: RootState) => state.gaussian.isFitting);
  const gaussianGuess = useSelector((state: RootState) => state.gaussian.guess);
  const gaussianSingleFit = useSelector((state: RootState) => state.gaussian.gaussianSingleFit);
  const gaussianStack = useSelector((state: RootState) => state.gaussian.gaussianStack);
  const showGaussianSingles = useSelector((state: RootState) => state.gaussian.showGaussianSingles);
  const showGaussianTable = useSelector((state: RootState) => state.gaussian.showGaussianTable);

  const cardHeight = 250 / (Number(showBaselineTable) + Number(showGaussianTable));

  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);
  const chart = chartComponentRef.current?.chart;

  const fileName = props.fileName;
  const dataSource = props.dataSource;
  const unit = props.unit;
  const setUnit = props.setUnit;

  const fitBaseline = (order: number, points: number[][]) => {
    const xdata = points.map((item: number[]) => { return item[0] });
    const ydata = points.map((item: number[]) => { return item[1] });
    const result = dataSource?.fit_baseline(xdata, ydata, unit, order).toJs();
    const fit = [].slice.call(result);
    dispatch(setBaselineFit(fit));
  }

  const fitGaussian = (baseline: number[], order: number, guess: number[][]) => {
    const guessInCurrentUnit = guess.map((g: number[]) => {
      const [xmin, xmax, ymin, ymax] = g;
      const tmp1 = dataSource?.convertfreq(xmin, unit);
      const tmp2 = dataSource?.convertfreq(xmax, unit);
      const xmin2 = tmp1 <= tmp2 ? tmp1 : tmp2;
      const xmax2 = tmp1 <= tmp2 ? tmp2 : tmp1;
      return [xmin2, xmax2, ymin, ymax];
    });
    const result = dataSource?.fit_gaussian(unit, baseline, order, guessInCurrentUnit).toJs();
    const stack = [].slice.call(result[0]);
    const singlefit = result[1].map((g: number[]) => [].slice.call(g));
    const params = result[2].map((p: number[]) => [].slice.call(p));
    dispatch(setGaussianStack(stack));
    dispatch(setGaussianParams(params));
    dispatch(setGaussianSingleFit(singlefit));
  }

  const selectPoints = (e: any) => {

    // const chart = chartComponentRef.current?.chart;

    // console.log(e)
    // console.log(chart)
    // console.log("chart option", chart?.options)

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

    dispatch(setBaselinePoints(data));
    fitBaseline(baselineFitOrder, data);

    // Fire a custom event
    // console.log("highchart", Highcharts);
    // Highcharts.fireEvent(chart, 'selectedpoints', { points: chart?.getSelectedPoints() });

    return false; // Don't zoom
  }

  const unSelectAllPoints = () => {
    const points = chart?.getSelectedPoints();
    if (points?.length && points.length > 0) {
      points.forEach((point) => {
        point.select(false);
      })
    }
    dispatch(setBaselinePoints([]));
    fitBaseline(baselineFitOrder, []);
  }

  const selectRange = (e: any) => {

    const xmin = dataSource?.convert2freq(e.xAxis[0].min, unit);
    const xmax = dataSource?.convert2freq(e.xAxis[0].max, unit);
    const ymin = e.yAxis[0].min;
    const ymax = e.yAxis[0].max;

    const guess = [xmin, xmax, ymin, ymax];
    dispatch(setGaussianGuess([...gaussianGuess, guess]));

    if (isFitting) {
      fitGaussian(baselineFitValues, order, [...gaussianGuess, guess]);
    }

    return false; // Don't zoom
  }

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
        events: {
          click: (e) => {
            dispatch(
              setGaussianGuess(
                gaussianGuess.filter(
                  (value: number[], index: number) =>
                    index !== e.point.series.index - (3 - Number(showSubtraction))
                )));
          }
        }
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
        item[1] = baselineFitValues[i];
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
          allowPointSelect: drag !== "zoom",
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
          colorIndex: 1,
        })
      }
      console.log("series", options.series);
    }

    if (gaussianGuess) {
      const series = gaussianGuess.map((guess: number[], index: number) => {
        const [xmin, xmax, ymin, ymax] = guess;
        const xmin2 = dataSource?.convertfreq(xmin, unit);
        const xmax2 = dataSource?.convertfreq(xmax, unit);
        const data: Highcharts.SeriesOptionsType = {
          name: `Peak ${index + 1}`,
          type: 'polygon',
          data: [[xmin2, ymin], [xmax2, ymin], [xmax2, ymax], [xmin2, ymax]],
          colorIndex: 2,
          opacity: 0.5
        }
        return data;
      });
      if (series) options.series = [...options.series, ...series];
    }

    if (gaussianStack) {
      const gaussian = xdataArray.map((xi: number, i: number) => {
        return [xi, gaussianStack[i]];
      });
      options.series.push(
        {
          name: 'Gaussian',
          type: 'line',
          data: gaussian,
          findNearestPointBy: 'xy',
          colorIndex: 3,
        },
      );
    }

    if (gaussianSingleFit && showGaussianSingles) {
      const singles = gaussianSingleFit.map((single: number[]) => {
        return single.map((yi: number, i: number) => {
          return [xdataArray[i], yi];
        })
      });
      singles.forEach((item: number[][], i: number) => {
        options.series?.push(
          {
            name: `Gaussian Component ${i}`,
            type: 'area',
            data: item,
            colorIndex: 4 + i,
          }
        )
      })
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

    const subtitle = `${header.get("CTYPE2")}: ${toSciSymbol(header.get("CRVAL2"))}, ${header.get("CTYPE3")}: ${toSciSymbol(header.get("CRVAL3"))}`;

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

  if (drag === "baseline" && options.chart) {
    options.chart.zoomType = 'xy';
    options.chart.renderTo = chart?.container;
    options.chart.events = {
      selection: selectPoints,
      click: unSelectAllPoints,
    };
  }
  else if (drag === "gaussian" && options.chart) {
    options.chart.zoomType = 'xy';
    options.chart.renderTo = chart?.container;
    options.chart.events = {
      selection: selectRange,
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
  };

  return (
    <div>
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        ref={chartComponentRef}
        containerProps={{
          onMouseMove: handleMouseMove,
        }}
      />
      <Toolbar
        unit={unit}
        setUnit={setUnit}
        dataSource={dataSource}
        fitBaseline={fitBaseline}
        fitGaussian={fitGaussian}
        unSelectAllPoints={unSelectAllPoints}
      />
      <Divider />
      <Collapse isOpen={showBaselineTable}>
        {/* <Pre>
          Dummy text.
        </Pre> */}
        <BaselineTable height={cardHeight} />
      </Collapse>
      <Collapse isOpen={showGaussianTable}>
        <GaussianTable height={cardHeight} />
      </Collapse>
    </div>
  );
});


const BaselineTable = (props: any) => {
  const baselinePoints = useSelector((state: RootState) => state.baseline.baselinePoints)
  const pointX = (rowIndex: number) => (
    <Cell>{`${baselinePoints[rowIndex] ? (toSciSymbol(baselinePoints[rowIndex][0])) : 0.0}`}</Cell>
  );
  const pointY = (rowIndex: number) => (
    <Cell>{`${baselinePoints[rowIndex] ? (toSciSymbol(baselinePoints[rowIndex][1])) : 0.0}`}</Cell>
  );
  return (
    <Card style={{ display: "block", overflow: "auto", height: props.height }}>
      Selected Points:
      <Table2 numRows={baselinePoints.length} enableGhostCells={true} columnWidths={[400, 400]}>
        <Column name="X coordinate" cellRenderer={pointX} />
        <Column name="Y coordinate" cellRenderer={pointY} />
      </Table2>
    </Card>
  )
}

const GaussianTable = (props: any) => {
  const ngauss = useSelector((state: RootState) => state.gaussian.order);
  const gaussianGuess = useSelector((state: RootState) => state.gaussian.guess);
  const gaussianParams = useSelector((state: RootState) => state.gaussian.gaussianParams);

  const rangeX = (rowIndex: number) => (
    <Cell>
      ({`${gaussianGuess[rowIndex] ? (toSciSymbol(gaussianGuess[rowIndex][0])) : 0.0}`},
      {` ${gaussianGuess[rowIndex] ? (toSciSymbol(gaussianGuess[rowIndex][1])) : 0.0}`})
    </Cell>
  );
  const rangeY = (rowIndex: number) => (
    <Cell>
      ({`${gaussianGuess[rowIndex] ? (toSciSymbol(gaussianGuess[rowIndex][2])) : 0.0}`},
      {` ${gaussianGuess[rowIndex] ? (toSciSymbol(gaussianGuess[rowIndex][3])) : 0.0}`})
    </Cell>
  );
  const mean = (rowIndex: number) => (
    <Cell>{`${gaussianParams[rowIndex] ? (toSciSymbol(gaussianParams[rowIndex][0])) : 0.0}`}</Cell>
  )
  const sigma = (rowIndex: number) => (
    <Cell>{`${gaussianParams[rowIndex] ? (toSciSymbol(gaussianParams[rowIndex][1])) : 0.0}`}</Cell>
  )
  const amplitude = (rowIndex: number) => (
    <Cell>{`${gaussianParams[rowIndex] ? (toSciSymbol(gaussianParams[rowIndex][2])) : 0.0}`}</Cell>
  )

  const nrows = ngauss > gaussianGuess.length ? ngauss : gaussianGuess.length;
  return (
    <Card style={{ display: "block", overflow: "auto", height: props.height }}>
      Constraints:
      {/* <Table2 numRows={nrows} enableGhostCells={true}> */}
      <Table2 numRows={nrows} enableGhostCells={true} columnWidths={[400, 400, 150, 150, 150]}>
        {/* <Table2 numRows={gaussianGuess.length} enableGhostCells={true}> */}
        <Column name="X range" cellRenderer={rangeX} />
        <Column name="Y range" cellRenderer={rangeY} />
        <Column name="mean" cellRenderer={mean} />
        <Column name="sigma" cellRenderer={sigma} />
        <Column name="amplitude" cellRenderer={amplitude} />
      </Table2>
    </Card>
  )
}

export default Viewer;