import { useRef, useState, memo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HC_exporting from 'highcharts/modules/exporting';

HC_exporting(Highcharts);
require("highcharts/modules/draggable-points")(Highcharts);

const Canvas = memo((props: any) => {

  // const chartComponentRef = props.chartComponentRef;
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);
  const chart = chartComponentRef.current?.chart;

  const options = props.options;

  const setBaselinePoints = props.onSelect;

  const showSubtraction = props.showSubtraction;

  const selectPointsByDrag = (e: any) => {

    // const chart = chartComponentRef.current?.chart;

    console.log(e)
    console.log(chart)
    console.log("chart option", chart?.options)

    if (chart?.series) {
      chart.series.forEach(
        (series: any) => {
          series?.points.forEach(
            (point: any) => {
              if (point.x >= e.xAxis[0].min && point.x <= e.xAxis[0].max &&
                point.y >= e.yAxis[0].min && point.y <= e.yAxis[0].max) {
                point.select(true, true);
              }
            }
          )
        }
      )
    }

    const data = chart?.getSelectedPoints().map(
      (point) => { return [point.x, point.y] }
    )

    setBaselinePoints(data)

    // Fire a custom event
    // console.log("highchart", Highcharts);
    // Highcharts.fireEvent(chart, 'selectedpoints', { points: chart?.getSelectedPoints() });

    return false; // Don't zoom
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

  if (props.selectMode === true) {
    options.chart.zoomType = 'xy';
    options.chart.events = {
      selection: selectPointsByDrag,
      click: unselectByClick,
    };
  }
  else {
    options.chart.zoomType = 'x';
    options.chart.events = {
      selection: undefined,
      click: undefined,
      render: undefined,
    }
  }

  if (showSubtraction === true) {
    const subtractedData = props.source.map(
      (pos: Array<number>, idx: number) => {
        const baselinePoint = props.baselineData[idx] || [0.0, 0.0];
        return [pos[0], pos[1] - baselinePoint[1]]
      }
    )
    options.series = [
      {
        name: 'Observation - Baseline',
        type: 'scatter',
        data: subtractedData,
        allowPointSelect: props.selectMode,
        findNearestPointBy: 'xy',
      },
    ];
  }
  else {
    options.series = [
      {
        name: 'Observation',
        type: 'scatter',
        data: props.source,
        allowPointSelect: props.selectMode,
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

    if (props.baselineData) {
      // options.series = [
      //   ...options.series,
      //   {
      //     name: 'Baseline fitting',
      //     type: 'line',
      //     data: props.baselineData,
      //     colorIndex: 3,
      //   }
      // ]
      options.series.push({
        name: 'Baseline fitting',
        type: 'line',
        data: props.baselineData,
        colorIndex: 3,
      })
    }
    console.log("series", options.series);
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
      console.log(event);
    }
    console.log(event);
    return { xPos, yPos };
  }

  const [draggedPoint, setDraggedPoint] = useState<number[]>([]);

  const handleDragPoint = (event: any) => {
    const { xPos, yPos } = getCursorPos(event);
    console.log("drag", xPos, yPos);
    setDraggedPoint([xPos, yPos]);
  };

  const handleDropPoint = (event: any) => {
    console.log(event);
    const oldPointInfo = event.origin.points[event.newPointId];
    const oldPoint = [oldPointInfo.x, oldPointInfo.y];
    console.log(oldPoint);
    const newPoint = [event.newPoint.x, event.newPoint.y];
    props.onDrop(oldPoint, newPoint);
  };

  options.plotOptions = {
    scatter: {
      lineWidth: 2
    },
    series: {
      enableMouseTracking: true,
      tooltip: {
        followPointer: false,
      },
      point: {
        events: {
          dragStart: handleDragPoint,
          drop: handleDropPoint,
        }
      }
    },
  };

  const handleMouseMove = (event: any) => {
    const { xPos, yPos } = getCursorPos(event);
    props.onMouseMove(xPos, yPos);
  };

  // const handleDoubleClick = (event: any) => {
  //   const { xPos, yPos } = getCursorPos(event);
  //   props?.onDoubleClick([xPos, yPos]);
  // };

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
      // {...props}
      />
    </>
  );
});

// Canvas.defaultProps = {
//   options: {
//     title: {
//       text: 'My chart'
//     },
//     chart: {
//       zoomType: 'x'
//     },
//     tooltip: {
//       enabled: true
//     },
//     plotOptions: {
//       series: {
//         enableMouseTracking: true,
//         tooltip: {
//           followPointer: false
//         },
//       },
//     },
//   }
// }

export default Canvas;