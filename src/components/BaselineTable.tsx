const BaselineTable = (props: any) => {

  console.log("table", props.baseline);
  const baseline = props.baseline;

  return (
    baseline.map((item: any) => {
      return (
        <tr key={item[0]} onClick={() => { console.log("click table") }}>
          <td>{item[0]}</td>
          <td>{item[1]}</td>
          {/* <td><Button icon="cross" minimal={true} onClick={() => { setBaselinePoints(baselinePoints.filter(ele => ele !== item)) }} /></td> */}
        </tr>);
    })
  )
};

export default BaselineTable;