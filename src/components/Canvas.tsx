import { useRef, useState } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HC_exporting from 'highcharts/modules/exporting';

HC_exporting(Highcharts);

const Canvas = (props: any) => {

  // const chartComponentRef = props.chartComponentRef;
  const chartComponentRef = useRef<HighchartsReact.RefObject>(null);
  const chart = chartComponentRef.current?.chart;

  const options = props.options;
  // const handleMouseMove = props.onMouseMove;
  // const handleDoubleClick = props.onDoubleClick;
  const handleMouseMove = (event: any) => { props.onMouseMove(event, chart) };
  const handleDoubleClick = (event: any) => { props.onDoubleClick(event, chart) };

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
        {...props}
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