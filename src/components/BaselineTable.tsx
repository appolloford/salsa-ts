const BaselineTable = (props: any) => {

  const baseline = props.baseline;

  return (
    baseline.map((item: any, index: number) => {
      return (
        <tr style={{ display: "table" }} key={item[0]} onClick={() => { console.log("click table") }}>
          <td style={{ width: 140 }}>{index}</td>
          <td style={{ width: 140 }}>{item[0]}</td>
          <td style={{ width: 140 }}>{item[1]}</td>
          {/* <td><Button icon="cross" minimal={true} onClick={() => { setBaselinePoints(baselinePoints.filter(ele => ele !== item)) }} /></td> */}
        </tr>);
    })
  )
};

export default BaselineTable;