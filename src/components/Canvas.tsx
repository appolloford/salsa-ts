import { useRef, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HC_exporting from 'highcharts/modules/exporting';

HC_exporting(Highcharts);
require("highcharts/modules/draggable-points")(Highcharts);

const Canvas = (props: any) => {

  // const chartComponentRef = props.chartComponentRef;
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);
  const chart = chartComponentRef.current?.chart;

  const options = props.options;

  options.series = [
    {
      name: "Observation",
      type: 'line',
      data: props.source,
    },
    {
      name: "Baseline",
      type: "scatter",
      data: props.baselinePoints,
      dragDrop: {
        draggableX: true,
        draggableY: true
      },
    },
    {
      name: 'Baseline fitting',
      type: 'line',
      data: props.baselineData,
    }
  ];

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
    // const { xPos, yPos } = getCursorPos(event);
    //? Should the function be on
    // Highchart re-render when mouse moves. It consumes a lot resources
    // props.onMouseMove(xPos, yPos);
  };

  const handleDoubleClick = (event: any) => {
    const { xPos, yPos } = getCursorPos(event);
    props?.onDoubleClick([xPos, yPos]);
  };

  return (
    <>
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        ref={chartComponentRef}
        containerProps={{
          onMouseMove: handleMouseMove,
          onDoubleClick: handleDoubleClick,
        }}
      // {...props}
      />
    </>
  );
}

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